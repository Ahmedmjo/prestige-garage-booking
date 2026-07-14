import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SALT_LEN = 32;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const hash = Buffer.from(hashHex, "hex");
    const testHash = scryptSync(password, salt, KEY_LEN);
    return hash.length === testHash.length && timingSafeEqual(hash, testHash);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return phone.length >= 8 && /^\d+$/.test(phone);
}
