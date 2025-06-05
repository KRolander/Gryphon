import { get, set, del } from 'idb-keyval'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const SALT_LENGTH = 16
const IV_LENGTH = 12
const ITERATIONS = 100_000
const KEY_LENGTH = 256

const SESSION_KEY_PREFIX = 'session-key'

/**
 * Stores the Session key of the user in the IndexedDB, indexed with the userId.
 * @param {string} userId - The ID of the user, in hexadecimal format
 * @param {CryptoKey} key - The Session key to store
 */
export async function storeSessionKey(userId: string, key: CryptoKey): Promise<void> {
  await set(`${SESSION_KEY_PREFIX}-${userId}`, key)
}

/**
 * Retrieves the Session key of the user from the IndexedDB, indexed with the userId.
 * @param {string} userId - The ID of the user, in hexadecimal format
 * @returns {CryptoKey|null} - The Session key that was stored last under this userId, or null if no key could be retrieved
 */
export async function loadSessionKey(userId: string): Promise<CryptoKey | null> {
  const key = await get(`${SESSION_KEY_PREFIX}-${userId}`)
  return key ?? null
}

/**
 * Deletes the Session key of the user saved in the IndexedDB, indexed with the userId.
 * @param {string} userId - The ID of the user, in hexadecimal format
 */
export async function deleteSessionKey(userId: string): Promise<void> {
  await del(`${SESSION_KEY_PREFIX}-${userId}`)
}

/**
 * Derives a Crypto key from the given passphrase and salt.
 * The derivation is deterministic, that is, a given passphrase and a salt
 * always derive the same Crypto key.
 * @param {string} passphrase - The raw passphrase
 * @param {Uint8Array} salt - The salt, as a binary array
 * @return {Promise<CryptoKey>} The Crypto key derived from the given parameters
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts the given payload with the given Crypto key.
 * To ensure uniqueness a random IV (Initialization Vector) is used as well for encryption
 * The randomly generated IV is then prepended to the encrypted payload, for decryption
 * @param {any} payload - The payload to encrypt, the user wallet
 * @param {CryptoKey} sessionKey - The Crypto key used for encryption
 * @return {Promise<string>} The encrypted payload, as a Base64-encoded ASCII string,
 * following the format [IV - payload]
 */
export async function encryptWithSessionKey(payload: any, sessionKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = encoder.encode(JSON.stringify(payload))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sessionKey,
    plaintext
  )

  const encryptedBytes = new Uint8Array([...iv, ...new Uint8Array(ciphertext)])
  return btoa(String.fromCharCode(...encryptedBytes))
}

/**
 * Decrypts the given encrypted payload with the given Crypto key.
 * The payload should
 * @param {string} encrypted - The encrypted payload to decrypt, a Base64-encoded ASCII string
 * @param {CryptoKey} sessionKey - The Crypto key used for decryption, must be the save used for encryption
 * @return {Promise<string>} The decrypted payload, a Stringified JSON representing the wallet
 * @throws {Error} If the sessionKey is incorrect or invalid
 */
export async function decryptWithSessionKey(encrypted: string, sessionKey: CryptoKey): Promise<any> {
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const iv = encryptedBytes.slice(0, IV_LENGTH)
  const ciphertext = encryptedBytes.slice(IV_LENGTH)

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sessionKey,
      ciphertext
    )
    return JSON.parse(decoder.decode(decrypted))
  } catch(error) {
    throw new Error('Decryption failed. Check your passphrase')
  }
}

/**
 * Encrypts the given payload with the given passphrase.
 * A random salt is generated and used for hashing the passphrase and generate a Crypto key.
 * The payload is then encrypted with the Crypto key, by calling {@link encryptWithSessionKey}
 * The randomly generated salt is then prepended to the encrypted payload
 * @param {any} payload - The payload to encrypt, the user wallet
 * @param {string} passphrase - The raw passphrase used to derive a Crypto key
 * @return {Promise<string>} The encrypted payload, as a Base64-encoded ASCII string,
 * following the format [salt - IV - payload]
 */
export async function encrypt(payload: any, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const key = await deriveKey(passphrase, salt)

  const encrypted = await encryptWithSessionKey(payload, key)
  const encryptedBytes = new Uint8Array([...salt, ...Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))])
  return btoa(String.fromCharCode(...encryptedBytes))
}

/**
 * Decrypts the given encrypted payload with the given passphrase.
 * The salt is extracted from the encrypted payload and used to derive a Crypto key.
 * The payload is then decrypted by calling {@link decryptWithSessionKey}
 * @param {string} encrypted - The encrypted payload to decrypt, a Base64-encoded ASCII string.
 * It should follow the format [salt - IV - payload]
 * @param {string} passphrase - The raw passphrase used to derive the Crypto key used for decryption.
 * It must match the passphrase used for encryption
 * @return {Promise<string>} The decrypted payload, a Stringified JSON representing the wallet
 * @throws {Error} If the passphrase is incorrect,
 * or if the payload doesn't adhere to the format [salt - IV - payload]
 */
export async function decrypt(encrypted: string, passphrase: string): Promise<any> {
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const salt = encryptedBytes.slice(0, SALT_LENGTH)
  const rest = encryptedBytes.slice(SALT_LENGTH)

  const key = await deriveKey(passphrase, salt)
  return await decryptWithSessionKey(btoa(String.fromCharCode(...rest)), key)
}

/**
 * Extracts the salt from the given encrypted payload
 * The payload should follow the format [salt - IV - payload]
 * @param {string} encrypted - The encrypted payload, a Base64-encoded ASCII string
 * @return {Uint8Array} The salt stored in the encrypted payload, as a binary array
 */
export function extractSalt(encrypted: string): Uint8Array {
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  return encryptedBytes.slice(0, SALT_LENGTH)
}
