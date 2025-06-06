import { defineStore } from 'pinia'
import { get, set } from 'idb-keyval'
import { encrypt, decrypt, encryptWithSessionKey, decryptWithSessionKey, extractSalt, SALT_LENGTH } from '@/utils/crypto'

/**
 * Defines the structure of the wallet to be stored and the available methods.
 *
 * A wallet is defined as a list of DIDs, and each DID has a private
 * and public key, metadata, and a list of verifiable credentials.
 *
 * Each wallet is persisted in the IndexedDB as a key-value pair, using
 * the unique userId from keycloak as the key
 * @external idb-keyval
 * @external defineStore
 */
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
    /**
     * Adds the `did` to the current wallet with the associated private and public key,
     * Also saves the current date and time and stores it in the did metadata.
     *
     * Sets the newly created did as the `activeDid`
     *
     * @param {string} did - The did to add to the wallet, follows the format "**did:hlf:<uniqueId>**"
     * @param {{string, string}} keyPair - The pair of keys associated to `did`,
     * they must be cryptographically related and Base64-encoded ASCII strings
     * @param {string} name - Name to identify the `did` for the user
     */
    addDid(did: string, keyPair: { publicKey: string, privateKey: string }, name: string) {
      this.dids[did] = {
        keyPair,
        metadata: { createdAt: new Date().toISOString(), name: name },
        credentials: []
      }
      this.activeDid = did
    },

    /**
     * Adds a new Verifiable Credential (VC), to the given `did`
     *
     * @param {string} did - The did that receives the VC, follows the format "**did:hlf:<uniqueId>**"
     * @param {JSON} credential - The VC issued to the `did`
     */
    addCredential(did: string, credential: any) {
      this.dids[did]?.credentials.push(credential)
    },

    /**
     * Sets the `did` as the `activeDid`, if it exists
     *
     * @param {string} did - `did` to set as active
     */
    switchDid(did: string) {
      if (this.dids[did]) this.activeDid = did
    },

    /**
     * Removes the `did` from the wallet, if it exists.
     *
     * If it also was the `activeDid`, sets another existing one to be the `activeDid`
     *
     * @param {string} did - `did` to remove from the wallet
     */
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
      const salt = await this.getSalt(userId)
      const encrypted = await encryptWithSessionKey({ dids: this.dids, activeDid: this.activeDid }, sessionKey)

      const encryptedBytes = Uint8Array.from([
        ...salt,
        ...Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
      ])
      const saltedEncrypted = btoa(String.fromCharCode(...encryptedBytes))

      await set(`wallet-${userId}`, saltedEncrypted)
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
