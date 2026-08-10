import { createHash } from "node:crypto";

/**
 * Deterministically derives the DNS TXT verification token for an
 * organization. The token is derived (never stored), so it can be
 * recomputed at any time from the organization id alone.
 */
export function deriveDomainVerificationToken(organizationId: string): string {
  return createHash("sha1").update(organizationId).digest("hex").slice(0, 12);
}

/**
 * The exact DNS TXT value the organization must publish to prove
 * ownership of its custom domain.
 */
export function expectedTxtValue(token: string): string {
  return `zer-verify=${token}`;
}

/**
 * Flattens the record structure returned by dns.resolveTxt
 * (string[][] — one array of chunks per TXT record) into one
 * string per TXT record.
 */
export function flattenTxtRecords(records: string[][]): string[] {
  return records.map((chunks) => chunks.join(""));
}

/**
 * True when at least one published TXT record equals the expected
 * value (after trimming surrounding whitespace). Comparison is
 * exact — a record that merely contains the expected value as a
 * substring does not match.
 */
export function hasMatchingTxt(records: string[][], expected: string): boolean {
  return flattenTxtRecords(records).some(
    (record) => record.trim() === expected,
  );
}
