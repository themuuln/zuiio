import "server-only";
import { capture } from "@zuiio/capture";
import { markdownToMessengerFormat } from "@/lib/format-telegram";
import { withResilientFetch } from "@/lib/resilience";
import type { Channel, InlineButton, SendMessageOptions } from "./types";

const WHATSAPP_RESILIENCE_OPTIONS = {
	key: "meta-graph-whatsapp",
	label: "WhatsApp Cloud API",
	maxRetries: 2,
	timeoutMs: 15_000,
	concurrency: 16,
	queueCapacity: 32,
	throwOnNonOk: false,
} as const;

function fetchWhatsApp(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	return withResilientFetch(input, init, WHATSAPP_RESILIENCE_OPTIONS);
}

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
		const res = await fetchWhatsApp(`${this.baseUrl}/${endpoint}`, {
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
	): Promise<boolean> {
		const formatted = markdownToMessengerFormat(text);
		const res = await this.api("messages", {
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: chatId.toString(),
			type: "text",
			text: { body: formatted.substring(0, 4096) },
		});
		return res.ok;
	}

	async sendImage(
		chatId: number | string,
		imageUrl: string,
		caption?: string,
	): Promise<boolean> {
		if (imageUrl.startsWith("data:")) {
			try {
				const base64 = imageUrl.split(",")[1] ?? "";
				if (!base64) throw new Error("empty data URL");
				const buffer = Buffer.from(base64, "base64");
				const form = new FormData();
				form.append("messaging_product", "whatsapp");
				form.append(
					"file",
					new Blob([buffer], { type: "image/png" }),
					"qpay.png",
				);
				form.append("type", "image/png");
				const uploadRes = await fetchWhatsApp(`${this.baseUrl}/media`, {
					method: "POST",
					headers: { Authorization: `Bearer ${this.accessToken}` },
					body: form as unknown as BodyInit,
				});
				if (!uploadRes.ok) {
					const err = await uploadRes.text().catch(() => "unknown");
					capture(
						new Error(
							`WhatsApp media upload failed: ${uploadRes.status} ${err}`,
						),
						{
							context: "whatsapp: sendImage upload",
						},
					);
					return this.sendMessage(
						chatId,
						`${caption ? `${caption}\n` : ""}[QR зураг илгээхэд алдаа гарлаа — төлбөрийн линкээр төлнө үү.]`,
					);
				}
				const { id } = (await uploadRes.json()) as { id: string };
				const res = await this.api("messages", {
					messaging_product: "whatsapp",
					recipient_type: "individual",
					to: chatId.toString(),
					type: "image",
					image: { id, ...(caption ? { caption } : {}) },
				});
				return res.ok;
			} catch (error) {
				capture(error, { context: "whatsapp: sendImage data URL exception" });
				return this.sendMessage(
					chatId,
					`${caption ? `${caption}\n` : ""}[QR зураг түр боломжгүй — төлбөрийн линкээр төлнө үү.]`,
				);
			}
		}
		const res = await this.api("messages", {
			messaging_product: "whatsapp",
			recipient_type: "individual",
			to: chatId.toString(),
			type: "image",
			image: { link: imageUrl, ...(caption ? { caption } : {}) },
		});
		return res.ok;
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
}
