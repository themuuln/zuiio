import "server-only";
import { capture } from "@zuiio/capture";
import { debug } from "@/lib/debug";
import {
	convertMarkdownToRichBlocks,
	markdownToTelegramHtml,
} from "@/lib/format-telegram";
import { withResilientFetch } from "@/lib/resilience";

import type { Channel, InlineButton, SendMessageOptions } from "./types";

const TELEGRAM_API = "https://api.telegram.org/bot";

const TELEGRAM_RESILIENCE_OPTIONS = {
	key: "telegram-bot-api",
	label: "Telegram Bot API",
	maxRetries: 2,
	timeoutMs: 15_000,
	concurrency: 16,
	queueCapacity: 32,
	throwOnNonOk: false,
} as const;

function fetchTelegram(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	return withResilientFetch(input, init, TELEGRAM_RESILIENCE_OPTIONS);
}

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
	): Promise<boolean> {
		// Try rich message first (Bot API 10.1+ tables, headings, etc.)
		const richBlocks = convertMarkdownToRichBlocks(text);
		if (richBlocks.length > 0) {
			const sent = await this.sendRichMessage(chatId, richBlocks);
			if (sent) return true;
		}

		// Fallback: HTML with <pre> blocks for tables
		const formatted = markdownToTelegramHtml(text);
		const sendOpts = { ...options, parseMode: "HTML" as const };
		// Telegram limit: 4096 characters per message
		const MAX_LENGTH = 4096;
		if (formatted.length <= MAX_LENGTH) {
			return this.sendSingleMessage(chatId, formatted, sendOpts);
		}

		// Split on paragraph boundaries when possible
		let remaining = formatted;
		let allSent = true;
		while (remaining.length > 0) {
			let chunk = remaining.slice(0, MAX_LENGTH);
			// Try to split on last newline within limit
			const lastNewline = chunk.lastIndexOf("\n");
			if (lastNewline > MAX_LENGTH * 0.5 && remaining.length > MAX_LENGTH) {
				chunk = remaining.slice(0, lastNewline);
			}
			remaining = remaining.slice(chunk.length).trimStart();
			allSent =
				(await this.sendSingleMessage(chatId, chunk, sendOpts)) && allSent;
		}
		return allSent;
	}

	/**
	 * Returns false only when the bot definitively cannot reach the chat
	 * (Bot API 400/403: chat not found, bot blocked or kicked). Transient
	 * failures (network errors, 5xx, 429) return true so callers keep the
	 * link active and retry later.
	 */
	async isChatAvailable(chatId: number | string): Promise<boolean> {
		try {
			const res = await fetchTelegram(`${this.baseUrl}/getChat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chat_id: chatId }),
			});
			if (res.ok) return true;
			const err = await res.text().catch(() => "unknown");
			debug("telegram", "getChat failed", { status: res.status, err });
			return !(res.status === 400 || res.status === 403);
		} catch {
			return true;
		}
	}

	async sendDocument(
		chatId: number | string,
		fileBuffer: Buffer,
		filename: string,
		caption?: string,
	): Promise<void> {
		const formData = new FormData();
		formData.append("chat_id", String(chatId));
		formData.append(
			"document",
			new Blob([fileBuffer as unknown as BlobPart]),
			filename,
		);
		if (caption) formData.append("caption", caption);

		const res = await fetchTelegram(`${this.baseUrl}/sendDocument`, {
			method: "POST",
			body: formData,
		});
		if (!res.ok) {
			const err = await res.text().catch(() => "unknown");
			throw new Error(`Telegram sendDocument failed: ${res.status} — ${err}`);
		}
	}

	async sendImage(
		chatId: number | string,
		imageUrl: string,
		caption?: string,
	): Promise<boolean> {
		try {
			// QPay QR is returned as data:image/png;base64 — Telegram JSON photo
			// field does not accept data URLs, so re-encode as multipart.
			if (imageUrl.startsWith("data:")) {
				const base64 = imageUrl.split(",")[1] ?? "";
				if (!base64) return false;
				const buffer = Buffer.from(base64, "base64");
				const form = new FormData();
				form.append("chat_id", String(chatId));
				form.append(
					"photo",
					new Blob([buffer], { type: "image/png" }),
					"qpay.png",
				);
				if (caption) form.append("caption", caption);
				const res = await fetchTelegram(`${this.baseUrl}/sendPhoto`, {
					method: "POST",
					body: form as unknown as BodyInit,
				});
				if (!res.ok) {
					const err = await res.text().catch(() => "unknown");
					capture(
						new Error(
							`Telegram sendPhoto (multipart) failed: ${res.status} ${err}`,
						),
						{
							context: "telegram: sendImage data URL",
						},
					);
				}
				return res.ok;
			}
			const res = await fetchTelegram(`${this.baseUrl}/sendPhoto`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					photo: imageUrl,
					...(caption ? { caption } : {}),
				}),
			});
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(new Error(`Telegram sendPhoto failed: ${res.status} ${err}`), {
					context: "telegram: sendImage",
				});
			}
			return res.ok;
		} catch (error) {
			capture(error, { context: "telegram: sendImage exception" });
			return false;
		}
	}

	/**
	 * Send a rich message with native table rendering (Bot API 10.1+).
	 * Returns true if sent successfully, false to fall back to HTML.
	 */
	private async sendRichMessage(
		chatId: number | string,
		blocks: Array<Record<string, unknown>>,
	): Promise<boolean> {
		try {
			const res = await fetchTelegram(`${this.baseUrl}/sendRichMessage`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					rich_message: {
						content: { blocks },
					},
				}),
			});

			if (res.ok) return true;

			// Rich message not supported or failed — fall back silently
			const err = await res.text().catch(() => "unknown");
			debug("telegram", "sendRichMessage failed, falling back to HTML", {
				status: res.status,
				err,
			});
			return false;
		} catch {
			return false;
		}
	}

	private async sendSingleMessage(
		chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<boolean> {
		const body: Record<string, unknown> = {
			chat_id: chatId,
			text,
		};
		if (options?.parseMode) body.parse_mode = options.parseMode;
		if (options?.replyToMessageId)
			body.reply_to_message_id = options.replyToMessageId;

		const res = await fetchTelegram(`${this.baseUrl}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const err = await res.text().catch(() => "unknown");
			capture(new Error(`Telegram sendMessage failed: ${res.status} ${err}`), {
				context: "agent-gateway: telegram sendMessage",
			});
			return false;
		}
		return true;
	}

	async sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void> {
		const formatted = markdownToTelegramHtml(text);
		const replyMarkup = {
			inline_keyboard: buttons.map((row) =>
				row.map((btn) => ({
					text: btn.text,
					callback_data: btn.callbackData,
				})),
			),
		};

		const res = await fetchTelegram(`${this.baseUrl}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text: formatted,
				parse_mode: "HTML",
				reply_markup: replyMarkup,
			}),
		});

		if (!res.ok) {
			const err = await res.text().catch(() => "unknown");
			capture(
				new Error(`Telegram sendInlineKeyboard failed: ${res.status} ${err}`),
				{
					context: "agent-gateway: telegram sendInlineKeyboard",
				},
			);
		}
	}

	async answerCallbackQuery(
		callbackQueryId: string,
		text?: string,
	): Promise<void> {
		const body: Record<string, unknown> = {
			callback_query_id: callbackQueryId,
		};
		if (text) body.text = text;

		await fetchTelegram(`${this.baseUrl}/answerCallbackQuery`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
	}

	async editMessageText(
		chatId: number | string,
		messageId: number,
		text: string,
	): Promise<void> {
		await fetchTelegram(`${this.baseUrl}/editMessageText`, {
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

		const res = await fetchTelegram(`${this.baseUrl}/setWebhook`, {
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
	async getFile(
		fileId: string,
	): Promise<{ file_path: string; file_size?: number }> {
		const res = await fetchTelegram(
			`${this.baseUrl}/getFile?file_id=${encodeURIComponent(fileId)}`,
		);
		if (!res.ok) {
			const err = await res.text().catch(() => "unknown");
			throw new Error(`Telegram getFile failed: ${res.status} — ${err}`);
		}
		const data = await res.json();
		if (!data.ok || !data.result?.file_path) {
			throw new Error(
				`Telegram getFile returned no file_path: ${JSON.stringify(data)}`,
			);
		}
		return {
			file_path: data.result.file_path,
			file_size: data.result.file_size,
		};
	}

	/**
	 * Download a file from Telegram's file server.
	 * @param filePath — the file_path from getFile response
	 * @returns Buffer of the file contents
	 */
	async downloadFile(filePath: string): Promise<Buffer> {
		const fileUrl = `https://api.telegram.org/file/bot${this.baseUrl.split("/bot")[1]}/${filePath}`;
		const res = await fetchTelegram(fileUrl);
		if (!res.ok) {
			const err = await res.text().catch(() => "unknown");
			throw new Error(`Telegram downloadFile failed: ${res.status} — ${err}`);
		}
		const arrayBuffer = await res.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}

	/** Send a chat action (typing, upload_photo, etc.) for a more responsive feel. */
	async sendChatAction(
		chatId: number | string,
		action = "typing",
	): Promise<void> {
		await fetchTelegram(`${this.baseUrl}/sendChatAction`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: chatId, action }),
		});
	}
	/**
	 * Set a reaction emoji on a message.
	 * Used for status indicators: 👁️ received, ⏳ processing, ✅ done, ❌ error.
	 */
	async setReaction(
		chatId: number | string,
		messageId: number,
		emoji: string,
	): Promise<void> {
		try {
			const res = await fetchTelegram(`${this.baseUrl}/setMessageReaction`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					message_id: messageId,
					reaction: [{ type: "emoji", emoji }],
				}),
			});
			if (!res.ok) {
				const body = await res.text();
				capture(new Error(`setReaction ${res.status}: ${body}`), {
					context: "telegram:setReaction",
					chatId,
					messageId,
					emoji,
				});
			}
		} catch (err) {
			capture(err, {
				context: "telegram:setReaction:network",
				chatId,
				messageId,
			});
		}
	}

	/** Reaction emoji constants for message status */
	static readonly REACTIONS = {
		received: "👁️",
		processing: "⏳",
		done: "✅",
		error: "❌",
	} as const;
	/**
	 * Create or update a streaming draft message (Bot API 9.5+).
	 * Returns false when the API is unavailable so callers can fall back to
	 * editing a temporary message.
	 */
	async sendMessageDraft(
		chatId: number | string,
		draftId: number,
		text: string,
	): Promise<boolean> {
		try {
			const res = await fetchTelegram(`${this.baseUrl}/sendMessageDraft`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					draft_id: draftId,
					text,
				}),
			});
			if (!res.ok) return false;
			const data = (await res.json().catch(() => null)) as {
				ok?: boolean;
			} | null;
			return data?.ok !== false;
		} catch {
			// Draft failures are non-critical — streaming degrades gracefully.
			return false;
		}
	}

	/**
	 * Send the temporary message used by the edit-in-place streaming fallback.
	 * Returns the Telegram message ID, or null when the request fails.
	 */
	async sendStreamingPlaceholder(
		chatId: number | string,
	): Promise<number | null> {
		try {
			const res = await fetchTelegram(`${this.baseUrl}/sendMessage`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chat_id: chatId, text: "…" }),
			});
			if (!res.ok) return null;
			const data = (await res.json().catch(() => null)) as {
				ok?: boolean;
				result?: { message_id?: number };
			} | null;
			const messageId = data?.result?.message_id;
			return data?.ok !== false && typeof messageId === "number"
				? messageId
				: null;
		} catch {
			return null;
		}
	}

	/**
	 * Update the temporary message used by edit-in-place streaming.
	 */
	async editStreamingMessage(
		chatId: number | string,
		messageId: number,
		text: string,
	): Promise<boolean> {
		try {
			const res = await fetchTelegram(`${this.baseUrl}/editMessageText`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					message_id: messageId,
					text,
				}),
			});
			if (!res.ok) return false;
			const data = (await res.json().catch(() => null)) as {
				ok?: boolean;
			} | null;
			return data?.ok !== false;
		} catch {
			return false;
		}
	}
}
