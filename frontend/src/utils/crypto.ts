const encoder = new TextEncoder()
const decoder = new TextDecoder()

const SALT_LENGTH = 16
const IV_LENGTH = 12
const ITERATIONS = 100_000
const KEY_LENGTH = 256

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

export async function encryptWithSessionKey(payload: string, sessionKey: CryptoKey): Promise<string> {
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

// Returns an encrypted Base64 string that can be stored
export async function encrypt(payload: any, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const key = await deriveKey(passphrase, salt)

  const encrypted = await encryptWithSessionKey(payload, key)
  const encryptedBytes = new Uint8Array([...salt, ...Uint8Array.from(atob(encrypted))])
  return btoa(String.fromCharCode(...encryptedBytes))
}

export async function decrypt(encrypted: string, passphrase: string): Promise<any> {
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const salt = encryptedBytes.slice(0, SALT_LENGTH)
  const rest = encryptedBytes.slice(SALT_LENGTH)

  const key = await deriveKey(passphrase, salt)
  return await decryptWithSessionKey(btoa(String.fromCharCode(...rest)), key)
}
