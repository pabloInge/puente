import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM column encryption. Stored format: v1:<iv>:<authTag>:<ciphertext>, all base64url.
const VERSION = 'v1'
const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12

function getKey(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY
  if (!raw) throw new Error('FIELD_ENCRYPTION_KEY is not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes encoded in base64')
  }
  return key
}

export function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv, tag, ciphertext].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join(':')
}

export function decryptField(stored: string): string {
  const [version, iv, tag, ciphertext] = stored.split(':')
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Invalid encrypted field format')
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export function encryptNullable(value: string | null | undefined): string | null {
  return value ? encryptField(value) : null
}

export function decryptNullable(value: string | null | undefined): string | null {
  return value ? decryptField(value) : null
}
