import "server-only";
import crypto from "node:crypto";

/**
 * Envelope encryption for stored secrets (email app passwords).
 * AES-256-GCM with a key from CREDENTIAL_ENCRYPTION_KEY (base64, 32 bytes).
 * Never log plaintext; decrypt only in-memory at fetch time.
 */

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes (base64)");
  }
  return key;
}

/** Encrypt plaintext -> base64 payload of iv(12) + authTag(16) + ciphertext. */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/** Decrypt a payload produced by encryptSecret. */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Generate a fresh key (for setup docs / one-off use). */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
