import "server-only";
import { randomBytes, createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "./supabase";
import { env } from "./env";

const TOKEN_SECRET = env("TOKEN_SIGNING_SECRET") ?? "dev-secret-change-in-production";
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
/** Short token length: 10 chars of base36 = ~36^10 combinations, plenty for one-time use. */
const SHORT_TOKEN_LENGTH = 10;

// ─── HMAC stateless tokens (legacy — too long for Telegram deep links) ──────

interface TokenPayload {
 orgId: string;
 userId: string;
 productType: string;
 exp: number;
}

export function createLinkToken(
 orgId: string,
 userId: string,
 productType: string,
): string {
 const payload: TokenPayload = { orgId, userId, productType, exp: Date.now() + TOKEN_EXPIRY_MS };
 const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
 const sig = createHmac("sha256", TOKEN_SECRET).update(payloadStr).digest("base64url");
 return `${payloadStr}.${sig}`;
}

export function verifyLinkToken(
 token: string,
): { orgId: string; userId: string; productType: string } | null {
 const parts = token.split(".");
 if (parts.length !== 2) return null;
 const [payloadStr, sig] = parts as [string, string];
 const expectedSig = createHmac("sha256", TOKEN_SECRET).update(payloadStr).digest("base64url");
 if (sig !== expectedSig) return null;
 try {
  const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8")) as TokenPayload;
  if (payload.exp < Date.now()) return null;
  return { orgId: payload.orgId, userId: payload.userId, productType: payload.productType };
 } catch {
  return null;
 }
}

// ─── Short tokens (DB-backed, Telegram-compatible ≤64 chars) ─────────────────

/**
 * Create a short, Telegram-compatible one-time token.
 *
 * Generates a random 10-char ID, stores the payload in one_time_tokens,
 * and returns the short ID. This fits within Telegram's 64-char deep link limit.
 *
 * @returns The short token string (10 chars), or null on failure.
 */
export async function createShortToken(
 supabase: SupabaseClient,
 orgId: string,
 userId: string,
 productType: string,
): Promise<string | null> {
 // Generate a random short ID (base36: 0-9, a-z)
 const raw = randomBytes(8); // 8 bytes → ~10 base36 chars
 const shortId = raw
  .reduce((acc, byte) => acc + byte.toString(36).padStart(2, "0"), "")
  .slice(0, SHORT_TOKEN_LENGTH);

 const { error } = await supabase.from("one_time_tokens").insert({
  token_hash: shortId,
  organization_id: orgId,
  user_id: userId,
  product_type: productType,
  expires_at: new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString(),
 });

 if (error) {
  console.error("createShortToken insert error:", error.message);
  return null;
 }

 return shortId;
}

/**
 * Verify and consume a short one-time token.
 *
 * Looks up the short ID in one_time_tokens, checks expiry,
 * marks it as consumed, and returns the payload.
 *
 * @returns The payload if valid, null if expired/invalid/already used.
 */
export async function verifyShortToken(
 supabase: SupabaseClient,
 shortId: string,
): Promise<{ orgId: string; userId: string; productType: string } | null> {
 // Find the token
 const { data, error } = await supabase
  .from("one_time_tokens")
  .select("*")
  .eq("token_hash", shortId)
  .is("used_at", null)
  .single();

 if (error || !data) return null;

 // Check expiry
 if (new Date(data.expires_at) < new Date()) {
  // Clean up expired token
  await supabase.from("one_time_tokens").delete().eq("id", data.id);
  return null;
 }

 // Mark as consumed (one-time use)
 await supabase
  .from("one_time_tokens")
  .update({ used_at: new Date().toISOString() })
  .eq("id", data.id);

 return {
  orgId: data.organization_id,
  userId: data.user_id,
  productType: data.product_type,
 };
}
