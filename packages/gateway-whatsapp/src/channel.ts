import { capture } from "@zuiio/capture";
import { markdownToMessengerFormat } from "@zuiio/gateway-core";
import type { Channel, InlineButton, SendMessageOptions } from "@zuiio/gateway-core";

/** WhatsApp Cloud API channel adapter. */
export class WhatsAppChannel implements Channel {
	private baseUrl: string;
	private accessToken: string;

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

	private async api(
		endpoint: string,
		body: Record<string, unknown>,
	): Promise<Response> {
		const response = await fetch(`${this.baseUrl}/${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.accessToken}`,
			},
			body: JSON.stringify(body),
		});
		if (!response.ok) {
			const error = await response.text().catch(() => "unknown");
			capture(
				new Error(`WhatsApp ${endpoint} failed: ${response.status} ${error}`),
				{ context: "gateway-whatsapp: api" },
			);
		}
		return response;
	}

	async sendMessage(
		chatId: number | string,
		text: string,
		_options?: SendMessageOptions,
	): Promise<boolean> {
		const response = await this.api("messages", {
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: String(chatId),
			type: "text",
			text: { body: markdownToMessengerFormat(text).substring(0, 4096) },
		});
		return response.ok;
	}

	async sendInlineKeyboard(
		chatId: number | string,
		text: string,
		buttons: InlineButton[][],
	): Promise<void> {
		const flatButtons = buttons.flat().slice(0, 3);
		await this.api("messages", {
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: String(chatId),
			type: "interactive",
			interactive: {
				type: "button",
				body: { text: text.substring(0, 1024) },
				action: {
					buttons: flatButtons.map((button) => ({
						type: "reply",
						reply: {
							id: button.callbackData.substring(0, 256),
							title: button.text.substring(0, 20),
						},
					})),
				},
			},
		});
	}

	async answerCallbackQuery(
		_callbackQueryId: string,
		_text?: string,
	): Promise<void> {}

	async editMessageText(
		_chatId: number | string,
		_messageId: number,
		_text: string,
	): Promise<void> {}

	async configureWebhook(url: string, verifyToken: string): Promise<void> {
		const appId = process.env.WHATSAPP_APP_ID;
		if (!appId) {
			throw new Error("WHATSAPP_APP_ID is required for webhook configuration");
		}
		const response = await fetch(
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
		if (!response.ok) {
			throw new Error("Failed to configure WhatsApp webhook");
		}
	}
}
