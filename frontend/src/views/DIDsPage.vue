<template>
  <v-container
    class="fill-height d-flex flex-column align-center justify-center"
    max-width="800"
  >
    <!-- Welcome message -->
    <div>
      <div class="mb-8 text-center">
        <div class="text-body-1 font-weight-light mb-n1">Welcome to</div>
        <h1 class="text-h2 font-weight-bold">Your DIDs</h1>
      </div>
    </div>

    <!-- Import/Export wallet -->
    <v-btn class="ma-2" @click="exportWallet">
      Download Wallet <v-icon icon="mdi mdi-download" end></v-icon
    ></v-btn>

    <!-- Card containing DIDs -->
    <v-row class="w-100">
      <v-col cols="12">
        <v-card class="mx-auto">
          <!-- Card title -->
          <template v-slot:title>
            <span class="font-weight-black">Your DIDs</span>
          </template>

          <!-- Add button together with icon -->
          <template v-slot:append>
            <v-dialog v-model="dialogOpen" max-width="500">
              <!-- Activator button -->
              <template v-slot:activator="{ props: activatorProps }">
                <v-btn
                  v-bind="activatorProps"
                  variant="flat"
                  @click="dialogOpen = true"
                >
                  Add <v-icon icon="mdi-plus-circle" end></v-icon
                ></v-btn>
              </template>

              <!-- Dialog -->
              <template v-slot:default="{ isActive }">
                <v-card title="Create DID">
                  <v-card-text>
                    <v-form v-model="valid" @submit.prevent="createDID">
                      <v-text-field
                        v-model="newDIDname"
                        :counter="20"
                        :rules="DIDNameRules"
                        label="Name"
                        required
                      ></v-text-field>
                    </v-form>
                  </v-card-text>

                  <v-card-actions>
                    <v-btn
                      text="Close"
                      class="ma-2s"
                      @click="isActive.value = false"
                    ></v-btn>

                    <v-spacer></v-spacer>

                    <v-btn class="ma-2" variant="outlined" @click="createDID()">
                      Create
                      <v-icon icon="mdi-checkbox-marked-circle" end></v-icon>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </template>

          <!-- Card content -->
          <v-card-text class="bg-surface-light pt-4">
            <div
              v-if="emptyDIDList"
              class="text-body-1 font-weight-light mb-n1"
            >
              There are no DIDs yet. You can create one by click the button
              above
            </div>
            <v-card v-else v-for="DID in DIDs" :key="DID.did" class="mb-4 mt-4">
              <template v-slot:title>
                <span class="font-weight-black">{{DID.name}}</span>
              </template>

              <v-card-subtitle class="text-body-1 font-weight-light mb-4">
                {{ DID.did }}
              </v-card-subtitle>

              <!-- Delete DID -->
              <template v-slot:append>
                <v-dialog v-model="deleteDIDDialog" max-width="500">
                  <!-- Activator button -->
                  <template v-slot:activator="{ props: deleteButton }">
                    <v-btn
                      v-bind="deleteButton"
                      variant="outlined"
                      @click="deleteDIDDialog = true"
                    >
                      Delete DID <v-icon icon="mdi-file-document-remove-outline" end></v-icon
                    ></v-btn>
                  </template>

                  <!-- Dialog -->
                  <template v-slot:default="{ isActive }">
                    <v-card title="Are you sure you want to delete this DID?">
                      <v-card-actions>
                        <v-btn
                          text="No"
                          class="ma-2s"
                          variant="outlined"
                          @click="isActive.value = false"
                        >
                          No
                          <v-icon icon="mdi-cancel" end></v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn class="ma-2" variant="outlined" @click="deleteDID()"> <!-- TODO -->
                          Yes
                          <v-icon icon="mdi-checkbox-marked-circle" end></v-icon>
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </template>
                </v-dialog>
              </template>

              <v-card-actions>
                <v-btn class="ma-2" variant="outlined" @click="getDIDDocument(DID.did)" >
                  <span v-if="showHideToggle[DID.did]">Hide document</span>
                  <span v-else>Show DID document</span>
                </v-btn>
              </v-card-actions>
              <v-card class="mb-4 mt-4" color="grey-lighten-1">
                <pre v-if="didDoc[DID.did]" class="text-body-1 font-weight-light mb-n1"
                     style="white-space: pre-wrap; word-break: break-word; padding: 0 16px;">
                  {{ JSON.stringify(didDoc[DID.did], null, 2) }}
                </pre>
              </v-card>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="js">
/* ----------------------- IMPORTS ----------------------- */
import DIDService from '@/services/DIDService';
import { useWalletStore } from '@/wallet/storage';

/* ----------------------- CONFIG ----------------------- */
export default {
  name: "DIDsPage",
  data() {
    return {
      DIDs: [],
      wallet: null,

      // Session info
      // TODO: use the keycloak sub as userId instead of the hardcoded one
      userId: "keycloakId",
      // TODO: ask the user to input the password securely
      passphrase: "verySecurePassword",

      // Dialog state
      dialogOpen: false,
      deleteDIDDialog: false,
      valid: false,
      newDIDname: "",
      showHideToggle: {},
      didDoc: {},
      DIDNameRules: [
        value => {
          if (value) return true

          return 'Name is required.'
        },
        value => {
          if (value?.length <= 20) return true

          return 'Name must be less than 20 characters.'
        },
      ],
    }
  },
  methods: {
    // Method to handle the creation of a new DID
    async createDID() {
      if (this.valid) {
        // 0. Create keys
        const {publicKey,privateKey} = await this.generateKeys(); //still needs to handle private key
        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
        const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

        // 1. Send to backend
        const res = await DIDService.createDID(publicKeyBase64);
        console.log(res.data);

        // 2. Store in the wallet
        this.wallet.addDid(res.data, {
          publicKeyBase64,
          privateKeyBase64
        });
        this.wallet.dids[res.data].metadata.name = this.newDIDname;

        // 3. Persist the wallet
        await this.wallet.saveWallet(this.userId, this.passphrase);

        // 4. Add to the list
        this.DIDs.push({ name: this.newDIDname, did: res.data});

        // 5. Reset the form
        this.newDIDname = "";
        this.valid = false;

        // 6. Close the dialog
        this.dialogOpen = false;
      }
    },

    async generateKeys(){
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true, //used for being able to export the key
        ["sign","verify"]

      )
      //both are arrayBuffers:
      const publicKey = await window.crypto.subtle.exportKey("spki",keyPair.publicKey); //with exportKey not encrypted, use SubtleCrypto.wrapKey() for encryption
      const privateKey = await window.crypto.subtle.exportKey("pkcs8",keyPair.privateKey); //maybe let the user encrypt

      return {publicKey,privateKey};
    },

    async getDIDDocument(DID){
      if (this.showHideToggle[DID]){
        this.showHideToggle[DID]=false;
        this.didDoc[DID]=null;
        return;
      }
      // 1. Send to backend
      const res = await DIDService.getDIDDoc(DID);
      this.showHideToggle[DID]=true;
      this.didDoc[DID]=res.data;
      console.log(res.data);
    },

    async exportWallet() {
      await this.wallet.exportWallet(this.userId)
    }
  },
  computed: {
    emptyDIDList() {
      return this.DIDs.length === 0;
    },
    // Computed properties can be added here if needed
  },
  async mounted() {
    // Instantiate the wallet
    this.wallet = useWalletStore();

    if (!this.userId || !this.passphrase) {
      console.warn('User ID or wallet passphrase missing')
      return
    }

    try {
      await this.wallet.loadWallet(this.userId, this.passphrase)

      // Fill the page with the DIDs loaded from the wallet
      this.DIDs = Object.entries(this.wallet.dids).map(([did, data]) => ({
        did,
        name: data.metadata?.name || 'Unnamed DID'
      }))
    } catch (err) {
      console.error('Failed to load wallet:', err)
    }

    console.log("DIDsPage mounted");
  },
};
</script>

<style lang="css" scoped></style>
