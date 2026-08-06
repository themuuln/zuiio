import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withDbCapture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

/**
 * Embeddable analytics tokens.
 *
 * Raw tokens are generated client-side-never, shown to the creator exactly
 * once, and stored only as a SHA-256 hash so a database leak cannot be
 * replayed. The public /embed/report page validates incoming tokens by
 * hashing them and looking the hash up with the service client.
 */

/** The only scope today — read-only reports embed. */
export const EMBED_SCOPE_REPORTS = "reports" as const;

/** Default token lifetime in days when the caller does not specify one. */
export const DEFAULT_EMBED_EXPIRY_DAYS = 30;

export interface EmbedTokenRow {
  id: string;
  organization_id: string;
  token_hash: string;
  label: string;
  scopes: string[];
  expires_at: string;
  created_by: string | null;
  revoked_at: string | null;
  created_at: string | null;
}

/**
 * SHA-256 hex digest of a raw embed token.
 * Deterministic: the same token always produces the same hash.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Generate a cryptographically random 32-byte token (base64url).
 * This raw value is the ONLY representation ever shown to a user.
 */
export function generateEmbedToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * True when a token row can currently authorize an embed: not revoked,
 * within its lifetime, and carrying the "reports" scope.
 */
export function isTokenUsable(
  row: Pick<EmbedTokenRow, "scopes" | "expires_at" | "revoked_at">,
): boolean {
  if (row.revoked_at) return false;
  if (!row.scopes?.includes(EMBED_SCOPE_REPORTS)) return false;
  const expiresAt = Date.parse(row.expires_at);
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt > Date.now();
}

/** Expiry date `days` from now. */
export function embedExpiryFromDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Create an embed token for an organization and return the raw token once.
 * Only the hash is persisted; the raw token is the return value here and is
 * never retrievable afterwards.
 */
export async function tokenForOrg(
  supabase: SupabaseClient<Database>,
  orgId: string,
  label: string,
  options: {
    createdBy?: string | null;
    expiresInDays?: number;
    scopes?: string[];
  } = {},
): Promise<{ token: string; row: EmbedTokenRow } | { error: string }> {
  const rawToken = generateEmbedToken();
  const expiresInDays = options.expiresInDays ?? DEFAULT_EMBED_EXPIRY_DAYS;
  const scopes = options.scopes ?? [EMBED_SCOPE_REPORTS];

  const { data, error } = await withDbCapture(
    "embed: create token",
    supabase
      .from("embed_tokens" as never)
      .insert({
        organization_id: orgId,
        token_hash: hashToken(rawToken),
        label,
        scopes,
        expires_at: embedExpiryFromDays(expiresInDays).toISOString(),
        created_by: options.createdBy ?? null,
      } as never)
      .select("*")
      .single(),
  );

  if (error) return { error: "Токен үүсгэхэд алдаа гарлаа." };
  return { token: rawToken, row: data as unknown as EmbedTokenRow };
}

/**
 * Revoke a token (soft delete). The row stays for auditability; the embed
 * page stops authorizing it because revoked_at is set.
 */
export async function revokeToken(
  supabase: SupabaseClient<Database>,
  orgId: string,
  tokenId: string,
): Promise<{ row: EmbedTokenRow } | { error: string }> {
  const { data, error } = await withDbCapture(
    "embed: revoke token",
    supabase
      .from("embed_tokens" as never)
      .update({ revoked_at: new Date().toISOString() } as never)
      .eq("id" as never, tokenId)
      .eq("organization_id" as never, orgId)
      .select("*")
      .maybeSingle(),
  );

  if (error) return { error: "Токен цуцлахад алдаа гарлаа." };
  return { row: data as unknown as EmbedTokenRow };
}

/** List all tokens for an organization, newest first. */
export async function listTokens(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<EmbedTokenRow[]> {
  const { data } = await withDbCapture(
    "embed: list tokens",
    supabase
      .from("embed_tokens" as never)
      .select("*")
      .eq("organization_id" as never, orgId)
      .order("created_at" as never, { ascending: false }),
  );
  return (data as unknown as EmbedTokenRow[]) ?? [];
}
