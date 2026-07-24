import "server-only";
import { capture } from "@zuiio/capture";
import { markdownToMessengerFormat } from "@/lib/format-telegram";
import type { Channel, InlineButton, SendMessageOptions } from "./types";

/**
 * WhatsApp Cloud API channel adapter.
 * Uses credentials from WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars.
 *
 * To enable: set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env.local.
 * Business Solution Provider (BSP) like 360dialog, Twilio, or Wati.
 */
export class WhatsAppChannel implements Channel {
	private baseUrl: string;

	constructor(phoneNumberId?: string, accessToken?: string) {
		const id = phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
		const token = accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN;

		if (!id || !token) {
			throw new Error(
				"WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required for WhatsApp channel",
			);
		}

		this.baseUrl = `https://graph.facebook.com/v22.0/${id}`;
		this.accessToken = token;
	}

	private accessToken: string;

	private async api(
		endpoint: string,
		body: Record<string, unknown>,
	): Promise<Response> {
		const res = await fetch(`${this.baseUrl}/${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.accessToken}`,
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const err = await res.text().catch(() => "unknown");
			capture(new Error(`WhatsApp ${endpoint} failed: ${res.status} ${err}`), {
				context: "agent-gateway: whatsapp api",
			});
		}

		return res;
	}

	async sendMessage(
		chatId: number | string,
		text: string,
		_options?: SendMessageOptions,
	): Promise<void> {
		const formatted = markdownToMessengerFormat(text);
		await this.api("messages", {
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: chatId.toString(),
			type: "text",
			text: { body: formatted.substring(0, 4096) },
		});
	}

	async sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void> {
		// WhatsApp uses interactive message with button replies
		const flatButtons = buttons.flat().slice(0, 3); // WhatsApp max 3 buttons

		await this.api("messages", {
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: chatId.toString(),
			type: "interactive",
			interactive: {
				type: "button",
				body: { text: text.substring(0, 1024) },
				action: {
					buttons: flatButtons.map((btn) => ({
						type: "reply",
						reply: {
							id: btn.callbackData.substring(0, 256),
							title: btn.text.substring(0, 20),
						},
					})),
				},
			},
		});
	}

	async answerCallbackQuery(
		_callbackQueryId: string,
		_text?: string,
	): Promise<void> {
		// WhatsApp doesn't have callback queries like Telegram —
		// button replies arrive as regular messages with button payload
	}

	async editMessageText(
		_chatId: number | string,
		_messageId: number,
		_text: string,
	): Promise<void> {
		// WhatsApp doesn't support editing sent messages via Cloud API
	}

	/**
	 * Register a webhook endpoint for WhatsApp.
	 * @param url — public HTTPS URL for the webhook
	 * @param verifyToken — token for webhook verification challenge
	 */
	async configureWebhook(url: string, verifyToken: string): Promise<void> {
		const appId = process.env.WHATSAPP_APP_ID;
		if (!appId) {
			throw new Error("WHATSAPP_APP_ID is required for webhook configuration");
		}

		const res = await fetch(
			`https://graph.facebook.com/v22.0/${appId}/subscriptions`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.accessToken}`,
				},
				body: JSON.stringify({
					object: "whatsapp_business_account",
					callback_url: url,
					verify_token: verifyToken,
					fields: ["messages", "message_template_status_update"],
				}),
			},
		);

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`Failed to configure WhatsApp webhook: ${err}`);
		}
	}
}
