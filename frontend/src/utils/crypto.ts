const encoder = new TextEncoder()
const decoder = new TextDecoder()

const SALT_LENGTH = 16
const IV_LENGTH = 12
const ITERATIONS = 100_000
const KEY_LENGTH = 256

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
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

// Returns an encrypted Base64 string that can be stored
export async function encrypt(payload: any, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(passphrase, salt)
  const plaintext = encoder.encode(JSON.stringify(payload))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  )

  const encryptedBytes = new Uint8Array([...salt, ...iv, ...new Uint8Array(ciphertext)])
  return btoa(String.fromCharCode(...encryptedBytes))
}

export async function decrypt(encrypted: string, passphrase: string): Promise<any> {
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const salt = encryptedBytes.slice(0, SALT_LENGTH)
  const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH)

  const key = await deriveKey(passphrase, salt)

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    return JSON.parse(decoder.decode(decrypted))
  } catch(error) {
    throw new Error('Decryption failed. Check your passphrase')
  }
}
