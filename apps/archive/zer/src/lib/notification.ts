import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { sendWebPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventType = "low_stock" | "daily_summary" | "new_sale" | "delivery_status";

interface SendResult {
  success: boolean;
  error?: string;
}

type NotificationConfigData = {
  chat_id?: unknown;
  event_types?: unknown;
};

function getNotificationConfigData(value: unknown): NotificationConfigData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as NotificationConfigData;
}
function isEventEnabled(
  config: { config_data: unknown; enabled: boolean | null },
  eventType: EventType,
): boolean {
  if (!config.enabled) return false;
  const eventTypes = getNotificationConfigData(config.config_data).event_types;
  if (!Array.isArray(eventTypes) || eventTypes.length === 0) return true;
  return eventTypes.some((event) => event === eventType);
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
    .select("config_data,enabled")
    .eq("organization_id", orgId)
    .eq("channel", "telegram")
    .maybeSingle();

  if (!config) {
    return { success: false, error: "Telegram тохиргоо олдсонгүй." };
  }

  if (!isEventEnabled(config, eventType)) {
    return { success: false, error: "Энэ төрлийн мэдэгдэл идэвхгүй байна." };
  }

  // Get chat_id from the JSON config payload.
  const chatIdValue = getNotificationConfigData(config.config_data).chat_id;
  const chatId = typeof chatIdValue === "string" ? chatIdValue : null;

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
    capture(err, { context: "notification: sendNotification" });
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
 * Send a web push notification to every subscription of an organization.
 * Never throws — failures are captured and logged by sendWebPush.
 */
export async function notifyWebPushEvent(
  supabase: SupabaseClient<Database>,
  orgId: string,
  eventType: EventType,
  title: string,
  body: string,
  url?: string,
): Promise<void> {
  try {
    await sendWebPush(supabase, orgId, { title, body, url, eventType });
  } catch (err) {
    capture(err, { context: "notification: web push event" });
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

    await notifyWebPushEvent(
      await createClient(),
      orgId,
      "low_stock",
      "Бага нөөц",
      `${productName}\nҮлдэгдэл: ${currentStock} ширхэг\nДоод хязгаар: ${minStock} ширхэг`,
      "/products",
    );
  }
}

/**
 * Send a delivery status notification via Telegram.
 */
export async function notifyDeliveryStatus(
  orgId: string,
  contactName: string,
  deliveryStatus: string,
): Promise<void> {
  const statusLabels: Record<string, string> = {
    assigned: "📦 Хүргэлт даалгагдла",
    picked_up: "🚚 Хүргэлт гарлаа",
    in_transit: "🔄 Хүргэлт замдаа байна",
    delivered: "✅ Хүргэлт амжилттай",
    cancelled: "❌ Хүргэлт цуцалсан",
    failed: "❌ Хүргэлт амжилтгүй",
  };

  const label = statusLabels[deliveryStatus];
  if (!label) return;

  await sendTelegramNotification(
    orgId,
    "delivery_status",
    label,
    `*${contactName}*-ийн хүргэлт\n\nТөлөв: ${label}`,
  );
}

export type { EventType, SendResult };
