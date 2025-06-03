import { defineStore } from 'pinia'
import { get, set } from 'idb-keyval'
import { encrypt, decrypt, encryptWithSessionKey, decryptWithSessionKey, extractSalt, SALT_LENGTH } from '@/utils/crypto'

// The wallet is persisted in IndexedDB (idb) as a key-value pair
// Where the key corresponds to the Keycloak's subject claim (sub)
// And the value is an encrypted base64 string with the wallet data
export const useWalletStore = defineStore('wallet', {
  state: () => ({
    dids: {} as Record<string, {
      keyPair: { publicKey: string, privateKey: string },
      metadata: { name:string, createdAt: string, tags?: string[] },
      credentials: any[]
    }>,
    // activeDid can be used as the DID for issuing/presenting credentials
    activeDid: null as string | null
  }),

  actions: {
    addDid(did: string, keyPair: { publicKey: string, privateKey: string }) {
      this.dids[did] = {
        keyPair,
        metadata: { createdAt: new Date().toISOString() },
        credentials: []
      }
      this.activeDid = did
    },

    addCredential(did: string, credential: any) {
      this.dids[did]?.credentials.push(credential)
    },

    switchDid(did: string) {
      if (this.dids[did]) this.activeDid = did
    },

    removeDid(did: string) {
      delete this.dids[did]
      if (this.activeDid === did) this.activeDid = Object.keys(this.dids)[0] || null
    },

    async walletExists(userId: string): Promise<boolean> {
      const exists = await get(`wallet-${userId}`)
      return !!exists
    },

    async initEmptyWallet(userId: string, passphrase: string) {
      const encrypted = await encrypt({ dids: {}, activeDid: null }, passphrase)
      await set(`wallet-${userId}`, encrypted)
    },

    async saveWallet(userId: string, passphrase: string) {
      const encrypted = await encrypt({ dids: this.dids, activeDid: this.activeDid }, passphrase)
      await set(`wallet-${userId}`, encrypted)
    },

    async saveWalletWithSessionKey(userId: string, sessionKey: CryptoKey) {
      const encrypted = await encryptWithSessionKey({ dids: this.dids, activeDid: this.activeDid }, sessionKey)
      await set(`wallet-${userId}`, encrypted)
    },


    async loadWallet(userId: string, passphrase: string) {
      const encrypted = await get(`wallet-${userId}`)
      if (!encrypted) return
      try {
        const decrypted = await decrypt(encrypted, passphrase)
        this.dids = decrypted.dids
        this.activeDid = decrypted.activeDid
      } catch(error) {
        throw new Error("Failed to decrypt wallet. Check your passphrase.")
      }
    },

    async loadWalletWithSessionKey(userId: string, sessionKey: CryptoKey) {
      const encrypted = await get(`wallet-${userId}`)
      if (!encrypted) return
      try {
        const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
        const saltlessBytes = encryptedBytes.slice(SALT_LENGTH)
        const decrypted = await decryptWithSessionKey(btoa(String.fromCharCode(...saltlessBytes)), sessionKey)

        this.dids = decrypted.dids
        this.activeDid = decrypted.activeDid
      } catch(error) {
        throw new Error("Failed to decrypt wallet. Check your passphrase.")
      }
    },

    // Exports the encrypted wallet for multi-device porting
    async exportWallet(userId: string) {
      // Check if the wallet exists
      const encrypted = await get(`wallet-${userId}`)
      if (!encrypted) throw new Error("No wallet found for export")

      // Turn the wallet into a JSON Binary Large Object (BLOB)
      const blob: Blob = new Blob([encrypted], { type: 'application/json' })
      const url: string = URL.createObjectURL(blob)

      // Make a downloadable link and download it on the user PC
      const downloadLink = document.createElement('a')
      downloadLink.href = url
      downloadLink.download = 'wallet.json'
      downloadLink.click()

      // Cleanup BLOB from browser memory (to prevent memory leak)
      URL.revokeObjectURL(url)
    },

    async importWallet(encryptedFile: File, userId: string, passphrase: string) {
      const encrypted = await encryptedFile.text()

      // Try to decrypt, to ensure the passphrase correctly decrypts the encrypted file
      try {
        const decrypted = await decrypt(encrypted, passphrase)

        // If valid, replace local wallet values with the imported ones
        this.dids = decrypted.dids
        this.activeDid = Object.keys(this.dids)[0] || null

        // Save the wallet in the IndexedDB in local memory
        await set(`wallet-${userId}`, encrypted)
      } catch (err) {
        throw new Error("Failed to import wallet. Check your passphrase or file.")
      }
    },

    async getSalt(userId: string) {
      const encrypted = await get(`wallet-${userId}`)
      if (!encrypted) {
        throw new Error("No wallet found for this user")
      }
      return extractSalt(encrypted)
    }
  }
})
