import { defineStore } from 'pinia'
import { get, set } from 'idb-keyval'
import { encrypt, decrypt } from '@/utils/crypto'

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

    async saveWallet(userId: string, passphrase: string) {
      const encrypted = await encrypt({ dids: this.dids }, passphrase)
      await set(`wallet-${userId}`, encrypted)
    },

    async loadWallet(userId: string, passphrase: string) {
      const encrypted = await get(`wallet-${userId}`)
      if (!encrypted) return
      const decrypted = await decrypt(encrypted, passphrase)
      this.dids = decrypted.dids
      this.activeDid = Object.keys(this.dids)[0] || null
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
    }
  }
})
