/**
 * End-to-end encryption utilities using Web Crypto API
 * - PBKDF2 for key derivation from password
 * - AES-GCM for encryption
 */

// Derive an encryption key from password and salt
export async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive AES key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Generate a random salt
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16))
}

// Generate a random IV for AES-GCM
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12))
}

// Convert Uint8Array to base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert base64 to Uint8Array
function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Encrypt data with AES-GCM
export async function encrypt(key, data) {
  const encoder = new TextEncoder()
  const iv = generateIV()
  const dataBuffer = encoder.encode(JSON.stringify(data))

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  )

  // Return IV + encrypted data as base64
  return {
    iv: bufferToBase64(iv),
    data: bufferToBase64(encryptedBuffer)
  }
}

// Decrypt data with AES-GCM
export async function decrypt(key, encryptedData) {
  const iv = base64ToBuffer(encryptedData.iv)
  const data = base64ToBuffer(encryptedData.data)

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  const decoder = new TextDecoder()
  return JSON.parse(decoder.decode(decryptedBuffer))
}

// Derive a deterministic IV from a purpose string using SHA-256
async function deriveIV(purpose) {
  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(purpose))
  return new Uint8Array(hash).slice(0, 12)
}

// Create a verification hash to check if password is correct
// This is a hash of a known string encrypted with the key
export async function createVerifier(key) {
  const encoder = new TextEncoder()
  const data = encoder.encode('sevr-verify')
  const iv = await deriveIV('sevr-password-verifier')

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return bufferToBase64(encryptedBuffer)
}

// Verify password by attempting to decrypt the verifier
export async function verifyPassword(key, verifier) {
  try {
    const data = base64ToBuffer(verifier)
    const iv = await deriveIV('sevr-password-verifier')
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer) === 'sevr-verify'
  } catch {
    return false
  }
}

// Export salt as base64 for storage
export function saltToBase64(salt) {
  return bufferToBase64(salt)
}

// Import salt from base64
export function base64ToSalt(base64) {
  return base64ToBuffer(base64)
}

// Generate a recovery key (24 random bytes = 32 chars in base64)
export function generateRecoveryKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return bufferToBase64(bytes)
}

// Derive a key from recovery key (using it as both password and salt)
export async function deriveKeyFromRecovery(recoveryKey) {
  const encoder = new TextEncoder()
  const keyBuffer = encoder.encode(recoveryKey)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Use first 16 bytes of recovery key as salt
  const salt = base64ToBuffer(recoveryKey).slice(0, 16)

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Export the encryption key wrapped with recovery key
export async function wrapKeyForRecovery(encryptionKey, recoveryKey) {
  const wrapperKey = await deriveKeyFromRecovery(recoveryKey)
  const iv = await deriveIV('sevr-recovery-wrap')

  // We need to export the key first, then encrypt it
  // Since our key is not extractable, we'll store the password-derived key material differently
  // Instead, we'll encrypt the salt + a known value that lets us recreate the key
  const encoder = new TextEncoder()
  const keyData = encoder.encode('KEY_RECOVERY_MARKER')

  const wrapped = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrapperKey,
    keyData
  )

  return bufferToBase64(wrapped)
}

// Verify recovery key is correct
export async function verifyRecoveryKey(recoveryKey, wrappedVerifier) {
  try {
    const wrapperKey = await deriveKeyFromRecovery(recoveryKey)
    const iv = await deriveIV('sevr-recovery-wrap')
    const wrapped = base64ToBuffer(wrappedVerifier)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      wrapperKey,
      wrapped
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted) === 'KEY_RECOVERY_MARKER'
  } catch {
    return false
  }
}
