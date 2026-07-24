import "server-only";

import { capture } from "@zuiio/capture";
import { markdownToMessengerFormat } from "@/lib/format-telegram";
import type { Channel, InlineButton, SendMessageOptions } from "./types";

const GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Facebook Messenger + Instagram channel adapter.
 * Uses the Meta Graph API to send messages via Page Access Tokens.
 *
 * Both Messenger and Instagram use the same API endpoint:
 * POST /{page_id}/messages with the page's access token.
 *
 * Key differences:
 * - Messenger: supports Button Template, Generic Template, Quick Replies, Postbacks
 * - Instagram: supports Quick Replies only (no button templates, no postbacks)
 */
export class FacebookChannel implements Channel {
	private apiVersion: string;
	pageId?: string;
	pageAccessToken?: string;

	constructor(config?: {
		apiVersion?: string;
		pageId?: string;
		pageAccessToken?: string;
	}) {
		this.apiVersion = config?.apiVersion ?? GRAPH_API_VERSION;
		this.pageId = config?.pageId;
		this.pageAccessToken = config?.pageAccessToken;
	}

	async sendMessage(
		chatId: number | string,
		text: string,
		options?: SendMessageOptions,
	): Promise<void> {
		const pageId = this.pageId;
		const pageAccessToken = this.pageAccessToken;
		if (!pageId || !pageAccessToken) {
			capture(
				new Error("Facebook sendMessage missing pageId or pageAccessToken"),
				{
					context: "facebook-channel",
				},
			);
			return;
		}

		try {
			const url = `${GRAPH_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`;

			const formatted = markdownToMessengerFormat(text);
			const payload: Record<string, unknown> = {
				recipient: { id: chatId.toString() },
				messaging_type: "RESPONSE",
				message: { text: formatted },
			};

			// Add quick replies if provided
			if (options?.quickReplies?.length) {
				(payload.message as Record<string, unknown>).quick_replies =
					options.quickReplies.map((qr) => ({
						content_type: "text",
						title: qr.text,
						payload: qr.callbackData,
					}));
			}

			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(new Error(`Facebook send failed: ${res.status} ${err}`), {
					context: "facebook-channel",
				});
			}
		} catch (err) {
			capture(err, { context: "facebook-channel: sendMessage" });
		}
	}

	async sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void> {
		const pageId = this.pageId;
		const pageAccessToken = this.pageAccessToken;
		if (!pageId || !pageAccessToken) {
			capture(
				new Error(
					"Facebook sendInlineKeyboard missing pageId or pageAccessToken",
				),
				{
					context: "facebook-channel",
				},
			);
			return;
		}

		try {
			const url = `${GRAPH_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`;
			const flatButtons = buttons.flat();

			// Messenger: Button Template (max 3 buttons per template)
			// Instagram: Quick Replies only (no button templates)
			// Strategy: Use Quick Replies for both (works on both platforms)
			const payload: Record<string, unknown> = {
				recipient: { id: chatId.toString() },
				messaging_type: "RESPONSE",
				message: {
					text,
					quick_replies: flatButtons.slice(0, 11).map((btn) => ({
						content_type: "text",
						title: btn.text,
						payload: btn.callbackData,
					})),
				},
			};

			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(
					new Error(`Facebook inline keyboard failed: ${res.status} ${err}`),
					{
						context: "facebook-channel",
					},
				);
			}
		} catch (err) {
			capture(err, { context: "facebook-channel: sendInlineKeyboard" });
		}
	}

	async answerCallbackQuery(
		_callbackQueryId: string,
		_text?: string,
	): Promise<void> {
		// Facebook/Instagram don't have callback queries like Telegram
		// Messenger uses postbacks, Instagram has no equivalent
		// This is a no-op for FB/IG channels
	}

	async editMessageText(
		chatId: number | string,
		_messageId: number,
		text: string,
	): Promise<void> {
		// Facebook/Instagram don't support message editing
		// Send a new message instead with an indicator
		await this.sendMessage(chatId, `(засварласан) ${text}`);
	}

	/**
	 * Send a confirmation prompt with Quick Replies.
	 * Used for write tool confirmations on Messenger/Instagram.
	 */
	async sendConfirmation(
		chatId: number | string,
		text: string,
		confirmId: string,
	): Promise<void> {
		await this.sendInlineKeyboard(chatId, text, [
			[
				{ text: "✅ Баталгаажуулах", callbackData: `confirm:${confirmId}` },
				{ text: "❌ Цуцлах", callbackData: `reject:${confirmId}` },
			],
		]);
	}

	/**
	 * Subscribe a page to webhook events.
	 * Must be called after OAuth flow completes.
	 */
	async subscribeToWebhook(
		pageId: string,
		pageAccessToken: string,
		subscribedFields = "messages,messaging_postbacks",
	): Promise<boolean> {
		try {
			const url = `${GRAPH_API_BASE}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`;

			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subscribed_fields: subscribedFields }),
			});

			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(
					new Error(`Webhook subscription failed: ${res.status} ${err}`),
					{
						context: "facebook-channel",
					},
				);
				return false;
			}

			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: subscribeToWebhook" });
			return false;
		}
	}

	/**
	 * Get page info including Instagram account if linked.
	 */
	async getPageInfo(
		pageId: string,
		pageAccessToken: string,
	): Promise<{
		id: string;
		name: string;
		instagramBusinessAccount?: { id: string };
	} | null> {
		try {
			const url = `${GRAPH_API_BASE}/${pageId}?fields=id,name,instagram_business_account{id}&access_token=${pageAccessToken}`;

			const res = await fetch(url);
			if (!res.ok) return null;

			const data = (await res.json()) as {
				id: string;
				name: string;
				instagram_business_account?: { id: string };
			};

			return data;
		} catch {
			return null;
		}
	}
	/**
	 * Send a sender action (typing_on, typing_off, mark_seen).
	 * Used for streaming-like UX on Messenger/Instagram.
	 */
	async sendSenderAction(
		recipientId: string,
		action: "typing_on" | "typing_off" | "mark_seen",
	): Promise<void> {
		const pageId = this.pageId;
		const pageAccessToken = this.pageAccessToken;
		if (!pageId || !pageAccessToken) return;

		try {
			const url = `${GRAPH_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`;
			await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					recipient: { id: recipientId },
					sender_action: action,
				}),
			});
		} catch {
			// Sender action failures are non-critical
		}
	}
}
