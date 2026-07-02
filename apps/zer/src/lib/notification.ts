import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventType = "low_stock" | "daily_summary" | "new_sale";

interface SendResult {
  success: boolean;
  error?: string;
}

function isEventEnabled(
  config: { event_types: unknown; enabled: boolean | null },
  eventType: EventType,
): boolean {
  if (!config.enabled) return false;
  const eventTypes = config.event_types as string[] | null;
  if (!Array.isArray(eventTypes) || eventTypes.length === 0) return true;
  return eventTypes.includes(eventType);
}

/**
 * Send a Telegram notification for an organization.
 * Looks up config from notification_configs, reads bot token from app_config.
 * Logs result to notifications table.
 *
 * @param supabase - Optional pre-configured client (e.g., admin client for cron jobs).
 *                   If omitted, creates a server-side client with the user session.
 */
export async function sendTelegramNotification(
  orgId: string,
  eventType: EventType,
  title: string,
  message: string,
  supabase?: SupabaseClient<Database>,
): Promise<SendResult> {
  const client = supabase ?? (await createClient());

  // Fetch bot token from app_config (system-wide)
  const { data: botTokenRow } = await client
    .from("app_config")
    .select("value")
    .eq("key", "telegram_bot_token")
    .maybeSingle();

  const botToken = (botTokenRow?.value as { token?: string })?.token;

  if (!botToken) {
    return { success: false, error: "Бот токен тохируулаагүй байна." };
  }

  // Fetch org's telegram config
  const { data: config } = await client
    .from("notification_configs")
    .select("*")
    .eq("organization_id", orgId)
    .eq("channel", "telegram")
    .maybeSingle();

  if (!config) {
    return { success: false, error: "Telegram тохиргоо олдсонгүй." };
  }

  if (!isEventEnabled(config, eventType)) {
    return { success: false, error: "Энэ төрлийн мэдэгдэл идэвхгүй байна." };
  }

  // Get chat_id: first from new chat_id column, then fallback to config_data
  const chatId =
    config.chat_id ??
    (config.config_data as { chat_id?: string })?.chat_id ??
    null;

  if (!chatId) {
    return { success: false, error: "Chat ID тохируулаагүй байна." };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `*${title}*\n\n${message}`,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errBody}`);
    }

    // Log success
    await client.from("notifications").insert({
      organization_id: orgId,
      channel: "telegram",
      event_type: eventType,
      title,
      message,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Тодорхойгүй алдаа";

    // Log failure
    await client.from("notifications").insert({
      organization_id: orgId,
      channel: "telegram",
      event_type: eventType,
      title,
      message,
      status: "failed",
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Check if a product has low stock and send notification if needed.
 */
export async function checkLowStockAndNotify(
  orgId: string,
  productName: string,
  currentStock: number,
  minStock: number,
): Promise<void> {
  if (currentStock > 0 && currentStock <= minStock) {
    await sendTelegramNotification(
      orgId,
      "low_stock",
      "⚡ Бага нөөцтэй бүтээгдэхүүн",
      `*${productName}*\n\n` +
        `Үлдэгдэл: ${currentStock} ширхэг\n` +
        `Доод хязгаар: ${minStock} ширхэг\n\n` +
        `Нөөцөө нөхөх шаардлагатай байна.`,
    );
  }
}

export type { EventType, SendResult };
