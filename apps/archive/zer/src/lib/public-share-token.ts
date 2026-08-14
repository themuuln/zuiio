import { createHash, randomBytes } from "node:crypto";

/** 32-byte raw token length as hex = 64 characters */
export const TOKEN_LENGTH = 64;

/** Default expiry durations in days */
export const DEFAULT_EXPIRY = {
  invoice: 90,
  report: 7,
  receipt: 30,
} as const;

export type DocumentType = keyof typeof DEFAULT_EXPIRY;

/**
 * Generate a cryptographically random 32-byte token (64 hex chars).
 * Returns the raw token — this is the ONLY time it's shown to the user.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * SHA-256 hash a raw token for storage.
 * Deterministic: same input always produces the same hash.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Validate token shape: must be exactly 64 lowercase hex characters.
 */
export function isValidTokenFormat(token: string): boolean {
  return /^[0-9a-f]{64}$/.test(token);
}

/**
 * Calculate default expiry date for a document type.
 * Returns a Date set to DEFAULT_EXPIRY days from now.
 */
export function defaultExpiryDate(type: DocumentType): Date {
  const days = DEFAULT_EXPIRY[type];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Calculate expiry date from a number of days from now.
 */
export function expiryFromDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
