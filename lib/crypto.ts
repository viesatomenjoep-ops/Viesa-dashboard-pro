import "server-only";
import crypto from "node:crypto";

/**
 * AES-256-GCM versleuteling voor server-side geheimen (bv. MSAL-tokencache).
 * Sleutel via env MS_TOKEN_ENC_KEY: 32 bytes als base64 of hex.
 * Formaat van het resultaat: base64( iv[12] | tag[16] | ciphertext ).
 */
function sleutel(): Buffer {
  const raw = process.env.MS_TOKEN_ENC_KEY;
  if (!raw) throw new Error("MS_TOKEN_ENC_KEY ontbreekt.");
  const buf = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error("MS_TOKEN_ENC_KEY moet 32 bytes zijn (base64 of hex).");
  }
  return buf;
}

export function versleutel(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", sleutel(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function ontsleutel(payload: string): string {
  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ct = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", sleutel(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
