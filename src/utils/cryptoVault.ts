/**
 * Zero-Knowledge Client-Side Encryption Engine
 * Powered by Web Crypto API (AES-GCM 256-bit + PBKDF2 SHA-256)
 * 
 * Guarantees that sensitive field data (secret GPS coordinates, pool names,
 * notes, catch logs, and photos) are mathematically scrambled before being
 * written to cloud databases or sync endpoints.
 */

// Helper to convert ArrayBuffer to Base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 string to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2
 */
async function deriveAesKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Encrypts arbitrary JavaScript object/data using AES-256-GCM
 */
export async function encryptObject<T>(data: T, secretKeySeed: string): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const plaintextBytes = enc.encode(jsonString);

  // Generate cryptographic random Salt (16 bytes) and IV (12 bytes for AES-GCM)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive key
  const cryptoKey = await deriveAesKey(secretKeySeed, salt);

  // Encrypt with AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    cryptoKey,
    plaintextBytes
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer)
  };
}

/**
 * Decrypts AES-256-GCM ciphertext payload back into the original object
 */
export async function decryptObject<T>(payload: EncryptedPayload, secretKeySeed: string): Promise<T> {
  const saltBytes = base64ToBuffer(payload.salt);
  const ivBytes = base64ToBuffer(payload.iv);
  const ciphertextBytes = base64ToBuffer(payload.ciphertext);

  const cryptoKey = await deriveAesKey(secretKeySeed, saltBytes);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes
    },
    cryptoKey,
    ciphertextBytes
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}
