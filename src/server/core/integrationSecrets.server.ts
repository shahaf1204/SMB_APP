/**
 * Server-only integration secret protection (Meta access tokens, etc.).
 * Do not import from client code.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_PREFIX = 'v1:';

function deriveAesKey(): Buffer {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY is required to encrypt integration secrets');
  }
  return createHash('sha256').update(raw, 'utf8').digest();
}

/** AES-256-GCM — use for all new Meta token writes (Phase 3A+). */
export function encryptIntegrationSecret(plaintext: string): string {
  const key = deriveAesKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  return `${VERSION_PREFIX}${payload}`;
}

function decryptV1Payload(stored: string): string {
  const key = deriveAesKey();
  const raw = Buffer.from(stored.slice(VERSION_PREFIX.length), 'base64');
  if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted integration secret payload');
  }
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function decryptLegacyBase64(stored: string): string {
  return Buffer.from(stored, 'base64').toString('utf8');
}

/**
 * Decrypt stored Meta/integration secrets.
 * Supports v1 AES-GCM (new writes) and legacy base64 (existing rows).
 */
export function decryptIntegrationSecret(stored: string): string {
  if (stored.startsWith(VERSION_PREFIX)) {
    return decryptV1Payload(stored);
  }
  return decryptLegacyBase64(stored);
}

/** @deprecated for new code — use encryptIntegrationSecret. Legacy finance helpers still use base64 in supabase.server. */
export function decryptMetaAccessToken(stored: string): string {
  return decryptIntegrationSecret(stored);
}
