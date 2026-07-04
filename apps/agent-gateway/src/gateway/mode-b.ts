import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GatewayContext } from "./types";

/**
 * Mode B resolver — custom bot per organization.
 *
 * Custom bots are pre-mapped to an org via the custom_bots table.
 * No QR linking needed — the bot IS the organization.
 *
 * Resolution by `botKey` (opaque UUID that maps to custom_bots.id).
 */
export async function resolveOrgFromBotKey(
 supabase: SupabaseClient,
 botKey: string,
): Promise<GatewayContext | null> {
 const { data, error } = await supabase
  .from("custom_bots")
  .select("organization_id, product_type")
  .eq("id", botKey)
  .eq("is_active", true)
  .single();

 if (error || !data) {
  return null;
 }

 return {
  orgId: data.organization_id,
  userId: data.organization_id, // In Mode B, orgId IS the user identity
  productType: data.product_type as "tolom" | "zer",
  chatId: 0, // Will be filled by the webhook handler per-message
  telegramUserId: 0, // Will be filled by the webhook handler per-message
 };
}
