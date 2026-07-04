import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolved context for a gateway request. */
export interface GatewayContext {
  orgId: string;
  userId: string;
  productType: "tolom" | "zer";
  chatId: number;
  telegramUserId: number;
}

/** A link record from telegram_links table (actual Supabase schema). */
export interface LinkRecord {
  id: string;
  organization_id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_user_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  notification_preferences?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Result of resolving a chat/user to an org. */
export interface ResolutionResult {
  context: GatewayContext;
  link: LinkRecord;
}
