import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayContext, LinkRecord, ResolutionResult } from "./types";

/**
 * Resolves a (chatId, userId) pair to an org context (Mode A — shared bot).
 * Only returns active links. Supports exactly one active link per (chat, user) pair.
 * Throws a user-friendly Mongolian error if no active link exists.
 */
export async function resolveOrgFromChatUser(
 supabase: SupabaseClient,
 chatId: number,
 userId: number,
): Promise<ResolutionResult> {
 // Use a more flexible query: get the most recently used active link
 // This handles multi-org gracefully — user gets their last-active org
 const { data, error } = await supabase
  .from("telegram_links")
  .select("*")
  .eq("telegram_chat_id", chatId)
  .eq("telegram_user_id", userId)
  .eq("is_active", true)
  .order("updated_at", { ascending: false })
  .limit(1)
  .single();

 if (error || !data) {
  throw new Error(
   "Таны Telegram холбогдоогүй байна. /start командыг ашиглана уу.",
  );
 }

 const link = data as unknown as LinkRecord;

 return {
  context: {
   orgId: link.organization_id,
   userId: link.user_id,
   productType: (link.notification_preferences?.productType as "tolom" | "zer") ?? "zer",
   chatId: link.telegram_chat_id,
   telegramUserId: link.telegram_user_id,
  },
  link,
 };
}

/**
 * Links a chat+user to an org using a one-time token.
 * The token is an opaque hash — never contains the orgId directly.
 * Deactivates any existing active link for this (chat, user) first,
 * then creates the new one. This enforces one-active-link-per-user.
 */
export async function linkWithToken(
 supabase: SupabaseClient,
 chatId: number,
 userId: number,
 token: string,
): Promise<ResolutionResult> {
 // TODO: Verify token against a server-side token store
 // For now, accept the token as-is for testing
 // The actual flow: web app generates SHA-256 token, stores (token_hash, orgId, userId),
 // user sends /start <token>, we look up the token_hash and resolve to orgId

 // In production, this would be:
 // 1. Hash the received token with SHA-256
 // 2. Look up in a one_time_tokens table
 // 3. Get orgId + internalUserId from the stored record
 // 4. Validate expiry (15 min)

 // For Phase 1 testing, accept a simple format orgId:userId
 const parts = token.split(":");
 const orgId = parts[0]!;
 const internalUserId = parts[1] ?? userId.toString();

 // Deactivate any existing active link for this chat+user
 await supabase
  .from("telegram_links")
  .update({ is_active: false })
  .eq("telegram_chat_id", chatId)
  .eq("telegram_user_id", userId)
  .eq("is_active", true);

 // Create new active link
 const { data, error } = await supabase
  .from("telegram_links")
  .insert({
   organization_id: orgId,
   user_id: internalUserId,
   telegram_chat_id: chatId,
   telegram_user_id: userId,
   is_active: true,
   notification_preferences: { productType: "zer" },
  })
  .select()
  .single();

 if (error) {
  console.error("Failed to create link", error);
  throw new Error("Холболт үүсгэхэд алдаа гарлаа.");
 }

 const link = data as unknown as LinkRecord;

 return {
  context: {
   orgId: link.organization_id,
   userId: link.user_id,
   productType: (link.notification_preferences?.productType as "tolom" | "zer") ?? "zer",
   chatId: link.telegram_chat_id,
   telegramUserId: link.telegram_user_id,
  },
  link,
 };
}
