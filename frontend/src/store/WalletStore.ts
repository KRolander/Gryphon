import { defineStore } from "pinia";
import { get, set } from "idb-keyval";
import {
  encrypt,
  decrypt,
  encryptWithSessionKey,
  decryptWithSessionKey,
  extractSalt,
  SALT_LENGTH,
} from "@/utils/crypto";
import { VCBuilder,  UnsignedVCBuilder, VerifiableCredential } from "@/../../utils/VC";

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
export const useWalletStore = defineStore("wallet", {
  state: () => ({
    dids: {} as Record<
      string,
      {
        keyPair: { publicKey: string; privateKey: string };
        metadata: { name: string; createdAt: string; tags?: string[] };
        credentials: VerifiableCredential[];
      }
    >,
    // activeDid can be used as the DID for issuing/presenting credentials
    activeDid: null as string | null,
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
    addDid(did: string, keyPair: { publicKey: string; privateKey: string }, name: string) {
      this.dids[did] = {
        keyPair,
        metadata: { createdAt: new Date().toISOString(), name: name },
        credentials: [],
      };
      this.activeDid = did;
    },

<<<<<<< HEAD
=======
    /**
     * Adds a new Verifiable Credential (VC), to the given `did`
     *
     * @param {string} did - The did that receives the VC, follows the format "**did:hlf:<uniqueId>**"
     * @param {JSON} credential - The VC issued to the `did`
     */
    addCredential(did: string, credential: any) {
      this.dids[did]?.credentials.push(credential);
    },

    /**
     * Sets the `did` as the `activeDid`, if it exists
     *
     * @param {string} did - `did` to set as active
     */
>>>>>>> main
    switchDid(did: string) {
      if (this.dids[did]) this.activeDid = did;
    },

    /**
     * Removes the `did` from the wallet, if it exists.
     *
     * If it also was the `activeDid`, sets another existing one to be the `activeDid`
     *
     * @param {string} did - `did` to remove from the wallet
     */
    removeDid(did: string) {
      delete this.dids[did];
      if (this.activeDid === did) this.activeDid = Object.keys(this.dids)[0] || null;
    },

<<<<<<< HEAD
    addVC(did: string, credential: string) {
      this.dids[did]?.credentials.push(JSON.parse(credential) as VerifiableCredential);
    },

    getVCs(did: string) {
      return this.dids[did].credentials;
    },

    removeVC(did: string, credential: string) {
      const VC: VerifiableCredential = JSON.parse(credential);
      const index = this.dids[did]?.credentials.findIndex(cred => cred === VC);
      if (index && index != -1) {
        this.dids[did].credentials.splice(index, 1);
      }
    },

=======
    /**
     * Checks in the IndexedDB (`idb`) if the user with `userId` already has a wallet
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @returns True, if there's a wallet in `idb`, indexed at `userId`,
     * False otherwise
     */
>>>>>>> main
    async walletExists(userId: string): Promise<boolean> {
      const exists = await get(`wallet-${userId}`);
      return !!exists;
    },

    /**
     * Creates a new instance of `walletStore`, without any data yet.
     * Encrypts the wallet with the given `passphrase`.
     * Stores the wallet in the IndexedDB (`idb`), indexed at `userId`
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @param {string} passphrase - The raw passphrase used to encrypt the wallet
     */
    async initEmptyWallet(userId: string, passphrase: string) {
      const encrypted = await encrypt({ dids: {}, activeDid: null }, passphrase);
      await set(`wallet-${userId}`, encrypted);
    },

    /**
     * Encrypts the current wallet with the given `passphrase` and
     * stores it in the IndexedDB (`idb`), indexed at `userId`.
     *
     * Either this or {@link saveWalletWithSessionKey} must be used after
     * performing any altering operation, such as:
     * {@link addDid}, {@link removeDid}, {@link addCredential}
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @param {string} passphrase - The raw passphrase used to encrypt the wallet
     */
    async saveWallet(userId: string, passphrase: string) {
      const encrypted = await encrypt({ dids: this.dids, activeDid: this.activeDid }, passphrase);
      await set(`wallet-${userId}`, encrypted);
    },

    /**
     * Encrypts the current wallet with the given `sessionKey` and
     * stores it in the IndexedDB (`idb`), indexed at `userId`.
     *
     * Either this or {@link saveWallet} must be used after
     * performing any altering operation, such as:
     * {@link addDid}, {@link removeDid}, {@link addCredential}
     *
     * Unlike {@link saveWallet}, this method doesn't rely on a method
     * to generate a random salt for encryption, instead it extract the salt
     * of the current encryption and prepends it to the encrypted payload,
     * to consistently store encrypted wallets in the same format.
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @param {CryptoKey} sessionKey - The Crypto key used for encryption
     */
    async saveWalletWithSessionKey(userId: string, sessionKey: CryptoKey) {
      const salt = await this.getSalt(userId);
      const encrypted = await encryptWithSessionKey(
        { dids: this.dids, activeDid: this.activeDid },
        sessionKey
      );

      const encryptedBytes = Uint8Array.from([
        ...salt,
        ...Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0)),
      ]);
      const saltedEncrypted = btoa(String.fromCharCode(...encryptedBytes));

      await set(`wallet-${userId}`, saltedEncrypted);
    },

    /**
     * Searches in the IndexedDB (`idb`), for a wallet indexed at `userId`.
     * If there is one, it tries to decrypt it, using `passphrase`.
     * If it succeeds, it overrides the local wallet with the decrypted one
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @param {string} passphrase - The raw passphrase used to decrypt the wallet
     * @throws {Error} If the passphrase is incorrect,
     * or if the wallet wasn't encrypted correctly
     */
    async loadWallet(userId: string, passphrase: string) {
      const encrypted = await get(`wallet-${userId}`);
      if (!encrypted) return;
      try {
        const decrypted = await decrypt(encrypted, passphrase);
        this.dids = decrypted.dids;
        this.activeDid = decrypted.activeDid;
      } catch (error) {
        throw new Error("Failed to decrypt wallet. Check your passphrase.");
      }
    },

    /**
     * Searches in the IndexedDB (`idb`), for a wallet indexed at `userId`.
     *
     * If there is one, it removes the salt from the encrypted payload and tries to decrypt it, using `sessionKey`.
     *
     * If it succeeds, it overrides the local wallet with the decrypted one
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @param {CryptoKey} sessionKey - The Crypto key used to decrypt the wallet
     * @throws {Error} If `sessionKey` is invalid,
     * or if the wallet wasn't encrypted correctly
     */
    async loadWalletWithSessionKey(userId: string, sessionKey: CryptoKey) {
      const encrypted = await get(`wallet-${userId}`);
      if (!encrypted) return;
      try {
        const encryptedBytes = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
        const saltlessBytes = encryptedBytes.slice(SALT_LENGTH);
        const decrypted = await decryptWithSessionKey(
          btoa(String.fromCharCode(...saltlessBytes)),
          sessionKey
        );

        this.dids = decrypted.dids;
        this.activeDid = decrypted.activeDid;
      } catch (error) {
        throw new Error("Failed to decrypt wallet. Check your passphrase.");
      }
    },

    /**
     * Exports the encrypted wallet in the IndexedDB (`idb`), indexed at `userId`
     * as a JSON file, and lets the user download it.
     *
     * It can be used to keep a local copy of the wallet, since it only lives in
     * the `idb` in the browser memory, it also enables multi-device porting
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     */
    async exportWallet(userId: string) {
      // Check if the wallet exists
      const encrypted = await get(`wallet-${userId}`);
      if (!encrypted) throw new Error("No wallet found for export");

      // Turn the wallet into a JSON Binary Large Object (BLOB)
      const blob: Blob = new Blob([encrypted], { type: "application/json" });
      const url: string = URL.createObjectURL(blob);

      // Make a downloadable link and download it on the user PC
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "wallet.json";
      downloadLink.click();

      // Cleanup BLOB from browser memory (to prevent memory leak)
      URL.revokeObjectURL(url);
    },

    /**
     * Imports a wallet from the given `encryptedFile`,
     * from which an encrypted wallet is parsed.
     *
     * It first tries to decrypt the encrypted wallet with `passphrase`.
     *
     * If it succeeds, it loads the decrypted wallet and also
     * stores the encrypted one in the IndexedDB (`idb`), indexed at `userId`
     *
     * @param {File} encryptedFile - The JSON file that contains an encrypted wallet,
     * possibly created from {@link exportWallet}
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @param {string} passphrase - The raw passphrase used to decrypt the wallet
     * @throws {Error} If the passphrase is incorrect,
     * or if the wallet wasn't encrypted correctly
     */
    async importWallet(encryptedFile: File, userId: string, passphrase: string) {
      const encrypted = await encryptedFile.text();

      // Try to decrypt, to ensure the passphrase correctly decrypts the encrypted file
      try {
        const decrypted = await decrypt(encrypted, passphrase);

        // If valid, replace local wallet values with the imported ones
        this.dids = decrypted.dids;
        this.activeDid = Object.keys(this.dids)[0] || null;

        // Save the wallet in the IndexedDB in local memory
        await set(`wallet-${userId}`, encrypted);
      } catch (err) {
        throw new Error("Failed to import wallet. Check your passphrase or file.");
      }
    },

    /**
     * Searches in the IndexedDB (`idb`), for a wallet indexed at `userId`.
     *
     * If there is any, it calls the utils function {@link extractSalt} to
     * get the salt that was used for the encryption
     *
     * @param {string} userId - The ID of the user, in hexadecimal format
     * @returns The salt stored in the encrypted payload,
     * as a binary array
     * @throws {Error} - If there is no wallet indexed at `userId`
     */
    async getSalt(userId: string): Promise<Uint8Array> {
      const encrypted = await get(`wallet-${userId}`);
      if (!encrypted) {
        throw new Error("No wallet found for this user");
      }
      return extractSalt(encrypted);
    },
  },
});
