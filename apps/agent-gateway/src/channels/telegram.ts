import "server-only";

import type { Channel, InlineButton, SendMessageOptions } from "./types";

const TELEGRAM_API = "https://api.telegram.org/bot";

/**
 * Telegram bot channel adapter.
 * Uses the bot token from TELEGRAM_BOT_TOKEN env var.
 */
export class TelegramChannel implements Channel {
 private baseUrl: string;

 constructor(token?: string) {
  const botToken = token ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
   throw new Error("TELEGRAM_BOT_TOKEN is required");
  }
  this.baseUrl = `${TELEGRAM_API}${botToken}`;
 }

 async sendMessage(
  chatId: number | string,
  text: string,
  options?: SendMessageOptions,
 ): Promise<void> {
  const body: Record<string, unknown> = {
   chat_id: chatId,
   text,
  };
  if (options?.parseMode) body.parse_mode = options.parseMode;
  if (options?.replyToMessageId) body.reply_to_message_id = options.replyToMessageId;

  const res = await fetch(`${this.baseUrl}/sendMessage`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(body),
  });

  if (!res.ok) {
   const err = await res.text().catch(() => "unknown");
   console.error("Telegram sendMessage failed", res.status, err);
  }
 }

 async sendInlineKeyboard(
  chatId: number | string,
  text: string,
  buttons: InlineButton[][],
 ): Promise<void> {
  const replyMarkup = {
   inline_keyboard: buttons.map((row) =>
    row.map((btn) => ({
     text: btn.text,
     callback_data: btn.callbackData,
    })),
   ),
  };

  const res = await fetch(`${this.baseUrl}/sendMessage`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
   }),
  });

  if (!res.ok) {
   const err = await res.text().catch(() => "unknown");
   console.error("Telegram sendInlineKeyboard failed", res.status, err);
  }
 }

 async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const body: Record<string, unknown> = {
   callback_query_id: callbackQueryId,
  };
  if (text) body.text = text;

  await fetch(`${this.baseUrl}/answerCallbackQuery`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(body),
  });
 }

 async editMessageText(chatId: number | string, messageId: number, text: string): Promise<void> {
  await fetch(`${this.baseUrl}/editMessageText`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    chat_id: chatId,
    message_id: messageId,
    text,
   }),
  });
 }

 /** Set the webhook URL for the bot. */
 async setWebhook(url: string, secretToken?: string): Promise<void> {
  const body: Record<string, unknown> = { url };
  if (secretToken) body.secret_token = secretToken;

  const res = await fetch(`${this.baseUrl}/setWebhook`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(body),
  });

  if (!res.ok) {
   const err = await res.text().catch(() => "unknown");
   throw new Error(`Telegram setWebhook failed: ${res.status} — ${err}`);
  }
 }

 /**
  * Get file info from Telegram by file_id.
  * Returns the file_path needed to download the file.
  */
 async getFile(fileId: string): Promise<{ file_path: string; file_size?: number }> {
  const res = await fetch(`${this.baseUrl}/getFile?file_id=${encodeURIComponent(fileId)}`);
  if (!res.ok) {
   const err = await res.text().catch(() => "unknown");
   throw new Error(`Telegram getFile failed: ${res.status} — ${err}`);
  }
  const data = await res.json();
  if (!data.ok || !data.result?.file_path) {
   throw new Error(`Telegram getFile returned no file_path: ${JSON.stringify(data)}`);
  }
  return { file_path: data.result.file_path, file_size: data.result.file_size };
 }

 /**
  * Download a file from Telegram's file server.
  * @param filePath — the file_path from getFile response
  * @returns Buffer of the file contents
  */
 async downloadFile(filePath: string): Promise<Buffer> {
  const fileUrl = `https://api.telegram.org/file/bot${this.baseUrl.split("/bot")[1]}/${filePath}`;
  const res = await fetch(fileUrl);
  if (!res.ok) {
   const err = await res.text().catch(() => "unknown");
   throw new Error(`Telegram downloadFile failed: ${res.status} — ${err}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
 }

 /** Send a chat action (typing, upload_photo, etc.) for a more responsive feel. */
 async sendChatAction(chatId: number | string, action = "typing"): Promise<void> {
  await fetch(`${this.baseUrl}/sendChatAction`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ chat_id: chatId, action }),
  });
 }
}
