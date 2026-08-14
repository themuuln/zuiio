/**
 * Notification service — WhatsApp/Telegram/SMS integration
 */

export interface NotificationChannel {
  id: string;
  organization_id: string;
  type: "whatsapp" | "telegram" | "sms";
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  organization_id: string;
  channel_id: string;
  name: string;
  subject: string | null;
  body: string;
  is_active: boolean;
  created_at: string;
}

export interface TemplateVariables {
  customer_name?: string;
  sale_total?: string;
  sale_date?: string;
  invoice_number?: string;
  due_date?: string;
  points_earned?: string;
  points_balance?: string;
  organization_name?: string;
  [key: string]: string | undefined;
}

export function renderTemplate(
  body: string,
  variables: TemplateVariables,
): string {
  let result = body;
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
  }
  return result;
}

export const DEFAULT_TEMPLATES: Record<
  string,
  { name: string; body: string }[]
> = {
  whatsapp: [
    {
      name: "sale_receipt",
      body: "Сайн байна уу {{customer_name}}!\n\nТаны худалдан авалт: {{sale_total}}₮\nОгноо: {{sale_date}}\n\nБаярлалаа! 🙏",
    },
    {
      name: "payment_reminder",
      body: "Сайн байна уу {{customer_name}}!\n\nТаны {{invoice_number}} дугаар нэхэмжлэлийн төлбөр: {{sale_total}}₮\nХугацаа: {{due_date}}",
    },
    {
      name: "loyalty_points",
      body: "Сайн байна уу {{customer_name}}!\n\nТа {{points_earned}} оноо хүлээн авлаа.\nНийт оноо: {{points_balance}}",
    },
  ],
  telegram: [
    {
      name: "sale_receipt",
      body: "🧾 Худалдан авалт\n👤 {{customer_name}}\n💰 {{sale_total}}₮\n📅 {{sale_date}}",
    },
    {
      name: "low_stock_alert",
      body: "⚠️ Бүтээгдэхүүний үлдэгдэл багассан!\nНэр: {{product_name}}\nҮлдэгдэл: {{stock_quantity}}",
    },
  ],
  sms: [
    {
      name: "verification_code",
      body: "Таны нэвтрэх код: {{code}}. Хугацаа: 5 минут.",
    },
  ],
};

export function getChannelLabel(type: string): string {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    sms: "SMS",
  };
  return labels[type] ?? type;
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s-]{8,15}$/.test(phone);
}

export function isValidTelegramChatId(chatId: string): boolean {
  return /^-?\d+$/.test(chatId);
}
