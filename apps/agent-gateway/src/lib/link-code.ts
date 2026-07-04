import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

/**
 * Generate a random 8-char device auth code.
 *
 * Stores the code as a pending telegram_links entry (is_active=false).
 * When redeemed, the entry is activated.
 */
export async function createLinkCode(
 supabase: SupabaseClient,
 orgId: string,
 userId: string,
 productType: string,
): Promise<{ code: string; formatted: string } | null> {
 const bytes = randomBytes(8);
 const chars: string[] = [];
 for (let i = 0; i < CODE_LENGTH; i++) {
  chars.push(CHARS[bytes[i]! % CHARS.length]!);
 }
 const code = chars.join("");

 // Store as pending link — org/user known, chat/user unknown until redemption
 const { error } = await supabase.from("telegram_links").insert({
  organization_id: orgId,
  user_id: userId,
  telegram_chat_id: 0, // placeholder — filled on redemption
  telegram_user_id: 0, // placeholder
  is_active: false,
  notification_preferences: {
   link_code: code,
   product_type: productType,
   code_expires_at: new Date(Date.now() + CODE_EXPIRY_MS).toISOString(),
  },
 });

 if (error) {
  console.error("createLinkCode insert error:", error.message);
  return null;
 }

 return {
  code,
  formatted: `${code.slice(0, 4)}-${code.slice(4, 8)}`,
 };
}

/**
 * Redeem a device auth code sent by a user.
 *
 * Finds the pending telegram_links entry by code, validates expiry,
 * and activates it by setting the chat/user IDs.
 */
export async function redeemLinkCode(
 supabase: SupabaseClient,
 rawInput: string,
 chatId: number,
 userId: number,
): Promise<{ orgId: string; userId: string; productType: string } | null> {
 const code = rawInput.replace(/[\s-]/g, "").toUpperCase();

 if (code.length !== CODE_LENGTH) return null;

 // Find pending entries (is_active=false with this code)
 const { data: pending, error } = await supabase
  .from("telegram_links")
  .select("id, organization_id, user_id, notification_preferences")
  .eq("is_active", false)
  .order("created_at", { ascending: false })
  .limit(10);

 if (error || !pending) return null;

 // Find the one with matching code that hasn't expired
 const match = pending.find((entry) => {
  const prefs = entry.notification_preferences as Record<string, unknown> | null;
  if (prefs?.link_code !== code) return false;
  const expiresAt = prefs?.code_expires_at as string | undefined;
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
 });

 if (!match) return null;

 const prefs = match.notification_preferences as Record<string, unknown>;

 // Deactivate any existing active link for this chat+user
 await supabase
  .from("telegram_links")
  .update({ is_active: false })
  .eq("telegram_chat_id", chatId)
  .eq("telegram_user_id", userId)
  .eq("is_active", true);

 // Activate the link by setting chat/user IDs
 const { error: updateErr } = await supabase
  .from("telegram_links")
  .update({
   telegram_chat_id: chatId,
   telegram_user_id: userId,
   is_active: true,
   notification_preferences: {
    ...prefs,
    linked_via_code: true,
   },
   updated_at: new Date().toISOString(),
  })
  .eq("id", match.id);

 if (updateErr) {
  console.error("redeemLinkCode update error:", updateErr.message);
  return null;
 }

 return {
  orgId: match.organization_id,
  userId: match.user_id,
  productType: (prefs?.product_type as string) ?? "zer",
 };
}

/** Clean up expired pending codes. Call periodically or on-demand. */
export async function cleanupExpiredCodes(supabase: SupabaseClient): Promise<void> {
 const cutoff = new Date(Date.now() - CODE_EXPIRY_MS).toISOString();
 await supabase
  .from("telegram_links")
  .delete()
  .eq("is_active", false)
  .lt("created_at", cutoff)
  .eq("telegram_chat_id", 0);
}
