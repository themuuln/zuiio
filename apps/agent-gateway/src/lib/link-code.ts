import "server-only";
import { randomBytes } from "node:crypto";

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

interface CodeEntry {
  orgId: string;
  userId: string;
  productType: string;
  expiresAt: number;
}

const store = new Map<string, CodeEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of store) {
    if (entry.expiresAt < now) store.delete(code);
  }
}, 300_000);

export function createLinkCode(
  orgId: string,
  userId: string,
  productType: string,
): { code: string; formatted: string } {
  const bytes = randomBytes(8);
  const chars: string[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    chars.push(CHARS[bytes[i]! % CHARS.length]!);
  }
  const code = chars.join("");

  store.set(code, { orgId, userId, productType, expiresAt: Date.now() + CODE_EXPIRY_MS });

  return { code, formatted: `${code.slice(0, 4)}-${code.slice(4, 8)}` };
}

export function redeemLinkCode(rawInput: string): {
  orgId: string;
  userId: string;
  productType: string;
} | null {
  const code = rawInput.replace(/[\s-]/g, "").toUpperCase();
  if (code.length !== CODE_LENGTH) return null;

  const entry = store.get(code);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(code);
    return null;
  }

  store.delete(code);
  return { orgId: entry.orgId, userId: entry.userId, productType: entry.productType };
}
