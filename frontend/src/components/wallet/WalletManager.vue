<template>

  <!-- Import/Export wallet -->
  <v-container class="pt-4 pb-2" fluid>
    <v-row>
      <v-col cols="12" sm="6">
        <v-file-input
          label="Import Wallet"
          hide-details
          prepend-icon="mdi-upload"
          accept=".json"
          v-model="walletFile"
          @change="importWallet"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-btn class="ma-2" @click="exportWallet">
          Download Wallet <v-icon icon="mdi-download" end></v-icon
        ></v-btn>
      </v-col>
    </v-row>
  </v-container>

  <slot :wallet="{
  ...walletStore,
  save: this.save
}", :ready="isReady" />

  <!--Create password for new wallet-->
  <v-dialog v-model="newWalletPwDialog" persistent max-width="400px">
    <v-card>
      <v-card-title class="headline">Create a Passphrase</v-card-title>
      <v-card-subtitle class="headline">You will need it to unlock your wallet</v-card-subtitle>
      <v-card-text>
        <v-text-field
          v-model="passphrase"
          label="Passphrase"
          type="password"
          autofocus
          :error="passphrase.length > 0 && passphrase.length <= 5"
          :error-messages="passphrase.length > 0 && passphrase.length <= 5 ? ['Passphrase must be at least 6 characters'] : []"
          @keyup.enter="onEnter"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="passphrase.length <= 5"
          color="primary"
          @click="onEnter"
        >
          Unlock
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!--Input password to unlock wallet-->
  <v-dialog v-model="walletPwDialog" persistent max-width="400px">
    <v-card>
      <v-card-title class="headline">Unlock your wallet</v-card-title>

      <v-card-text>
        <v-text-field
          v-model="passphrase"
          label="Passphrase"
          type="password"
          autofocus
          :error="passphrase.length > 0 && passphrase.length <= 5"
          :error-messages="passphrase.length > 0 && passphrase.length <= 5 ? ['Passphrase must be at least 6 characters'] : []"
          @keyup.enter="onEnter"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="passphrase.length <= 5"
          color="primary"
          @click="onEnter"
        >
          Unlock
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { useWalletStore } from '@/store/WalletStore.ts'
import { mapStores } from "pinia";
import { deriveKey, storeSessionKey, loadSessionKey } from "@/utils/crypto.js";
import { useUserStore } from "@/store/userStore.js";
import { watch } from "vue";

export default {
  name: "WalletManager",
  data() {
    return {
      walletFile: null,
      isReady: false,

      // Session info
      userId: null,
      passphrase: "",
      sessionKey: null,
      initialized: false,

      // Dialog state
      walletPwDialog: false,
      newWalletPwDialog: false
    }
  },

  computed: {
    ...mapStores(useWalletStore, useUserStore),
  },

  methods: {
    async waitForPassphrase() {
      return new Promise(resolve => {
        this._resolvePassphrase = () => {
          this.walletPwDialog = false
          this.newWalletPwDialog = false
          resolve()
        }
      })
    },

    async ensureWallet() {
      const exists = await this.walletStore.walletExists(this.userId)

      if (!exists) {
        console.log("making new wallet")
        this.newWalletPwDialog = true
        await this.waitForPassphrase()
        await this.walletStore.initEmptyWallet(this.userId, this.passphrase)
        const salt = await this.walletStore.getSalt(this.userId)
        this.sessionKey = await deriveKey(this.passphrase, salt)
        this.passphrase = ""
        await storeSessionKey(this.userId, this.sessionKey)
      }
    },

    async unlockWallet(retries = 0) {
      if (retries > 3) {
        console.error("Too many failed attempts")
        return
      }
      // if there is no sessionKey, generate one with current passphrase and wallet's salt
      if (!this.sessionKey) {
        try {
          const salt = await this.walletStore.getSalt(this.userId)
          this.sessionKey = await deriveKey(this.passphrase, salt)
        } catch(error) {
          console.error("Failed to get salt or derive key:", error)
          this.walletPwDialog = true

          // Wait for the password and try again
          await this.waitForPassphrase()
          return await this.unlockWallet(retries + 1)
        }
      }

      // Try to unlock the wallet with the sessionKey
      try {
        await this.walletStore.loadWalletWithSessionKey(this.userId, this.sessionKey)
        await storeSessionKey(this.userId, this.sessionKey)
      } catch(error) {
        console.error("Failed to load wallet with session key:", error)

        // Discard invalid session key and prompt for a password
        this.sessionKey = null
        this.walletPwDialog = true

        // Wait for the password and try again
        await this.waitForPassphrase()
        return await this.unlockWallet(retries + 1)
      }
    },

    onEnter() {
      if (this.passphrase.length > 5 && this._resolvePassphrase) {
        this._resolvePassphrase()
        this._resolvePassphrase = null
      }
    },

    async exportWallet() {
      await this.walletStore.exportWallet(this.userId)
    },

    async importWallet() {
      if (!this.walletFile) {
        alert("Please select a valid file.")
        return
      }

      this.walletPwDialog = true
      await this.waitForPassphrase()

      try {
        this.sessionKey = null
        await this.walletStore.importWallet(this.walletFile, this.userId, this.passphrase)

        await this.unlockWallet()

        this.walletFile = null
        alert("Wallet imported successfully!")
      } catch(error) {
        alert("Failed to import wallet")
      }
    },

    async save() {
      await this.walletStore.saveWalletWithSessionKey(this.userId, this.sessionKey)
    }
  },

  async mounted() {
    await this.userStore.loadUser()
    // Wait for keycloak to finish storing the user
    watch(
      () => this.userStore.getUser,
      async (newUser) => {
        if (newUser && !this.initialized) {
          // Set initialized flag false, to avoid reacting to every user change
          this.initialized = true
          this.userId = newUser.id

          if (!this.userId) {
            console.error(`No user id found`)
            return
          }
          console.log(`Mounting wallet with user id: ${this.userId}`)
          this.sessionKey = await loadSessionKey(this.userId)
          await this.ensureWallet()
          await this.unlockWallet()
          console.log(`Wallet mounted`)
          this.isReady = true
        }
      },
      { immediate: true }
    )
  }
}
</script>


<style scoped lang="css">

</style>
