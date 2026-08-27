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
	): Promise<boolean> {
		const pageId = this.pageId;
		const pageAccessToken = this.pageAccessToken;
		if (!pageId || !pageAccessToken) {
			capture(
				new Error("Facebook sendMessage missing pageId or pageAccessToken"),
				{
					context: "facebook-channel",
				},
			);
			return false;
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
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: sendMessage" });
			return false;
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

	async sendProductCards(
		chatId: string,
		products: Array<{
			id: string;
			name: string;
			description?: string | null;
			salePrice?: number | null;
			currentStock?: number | null;
			imageUrl?: string | null;
		}>,
	): Promise<boolean> {
		if (!this.pageId || !this.pageAccessToken || products.length === 0) {
			return false;
		}

		const elements = products.slice(0, 10).map((product) => {
			const subtitle = [
				product.salePrice != null
					? `Үнэ: ₮${product.salePrice.toLocaleString("mn-MN")}`
					: null,
				product.currentStock != null
					? product.currentStock > 0
						? `Үлдэгдэл: ${product.currentStock}`
						: "Дууссан"
					: null,
			]
				.filter(Boolean)
				.join(" · ")
				.slice(0, 80);

			const element: Record<string, unknown> = {
				title: product.name.slice(0, 80),
				subtitle,
				buttons: [
					{
						type: "postback",
						title: "Дэлгэрэнгүй",
						payload: `PRODUCT:${product.id}`,
					},
					...(product.currentStock == null || product.currentStock > 0
						? [
								{
									type: "postback",
									title: "Сагсанд нэмэх",
									payload: `CART_ADD:${product.id}`,
								},
								{
									type: "postback",
									title: "Худалдаж авах",
									payload: `BUY:${product.id}`,
								},
							]
						: []),
				],
			};
			if (product.imageUrl) {
				element.image_url = product.imageUrl;
			}
			// Description fallback for subtitle when price/stock missing
			if (!subtitle && product.description) {
				element.subtitle = product.description.slice(0, 80);
			}
			return element;
		});
		try {
			const res = await fetch(
				`${GRAPH_API_BASE}/${this.pageId}/messages?access_token=${this.pageAccessToken}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						recipient: { id: chatId },
						messaging_type: "RESPONSE",
						message: {
							attachment: {
								type: "template",
								payload: { template_type: "generic", elements },
							},
						},
					}),
				},
			);
			if (!res.ok) {
				capture(new Error(`Facebook product cards failed: ${res.status}`), {
					context: "facebook-channel",
				});
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: sendProductCards" });
			return false;
		}
	}

	async sendImage(chatId: number | string, imageUrl: string): Promise<boolean> {
		const pageId = this.pageId;
		const pageAccessToken = this.pageAccessToken;
		if (!pageId || !pageAccessToken || !imageUrl) return false;
		const trimmed = imageUrl.trim();
		if (!trimmed) return false;
		// Normalize: allow https URL, data: URL, or raw base64
		const url =
			trimmed.startsWith("http") || trimmed.startsWith("data:")
				? trimmed
				: `data:image/png;base64,${trimmed}`;
		try {
			const res = await fetch(
				`${GRAPH_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						recipient: { id: String(chatId) },
						messaging_type: "RESPONSE",
						message: {
							attachment: {
								type: "image",
								payload: { url, is_reusable: true },
							},
						},
					}),
				},
			);
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(new Error(`Facebook sendImage failed: ${res.status} ${err}`), {
					context: "facebook-channel",
				});
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: sendImage" });
			return false;
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
	 * Subscribe a page to webhook events.
	 * Must be called after OAuth flow completes.
	 */
	async subscribeToWebhook(
		pageId: string,
		pageAccessToken: string,
		subscribedFields = "messages,messaging_postbacks,feed",
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
	 * Remove this page's subscription from the Meta webhook.
	 */
	async unsubscribeFromWebhook(
		pageId: string,
		pageAccessToken: string,
	): Promise<boolean> {
		try {
			const url = `${GRAPH_API_BASE}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`;
			const res = await fetch(url, { method: "DELETE" });
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(
					new Error(`Webhook unsubscription failed: ${res.status} ${err}`),
					{ context: "facebook-channel" },
				);
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: unsubscribeFromWebhook" });
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

	/**
	 * Reply to a Page comment publicly, as the Page.
	 * POST /{comment-id}/comments — requires pages_manage_engagement.
	 */
	async replyToComment(commentId: string, message: string): Promise<boolean> {
		const pageAccessToken = this.pageAccessToken;
		if (!pageAccessToken) return false;
		try {
			const res = await fetch(
				`${GRAPH_API_BASE}/${commentId}/comments?access_token=${pageAccessToken}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ message }),
				},
			);
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(new Error(`Comment reply failed: ${res.status} ${err}`), {
					context: "facebook-channel",
				});
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: replyToComment" });
			return false;
		}
	}

	/**
	 * Send the one allowed Private Reply DM for a comment.
	 * POST /{page-id}/messages with recipient.comment_id — requires pages_messaging.
	 * Meta enforces a single private reply per comment within 7 days.
	 */
	async sendPrivateReply(commentId: string, text: string): Promise<boolean> {
		const pageId = this.pageId;
		const pageAccessToken = this.pageAccessToken;
		if (!pageId || !pageAccessToken) return false;
		try {
			const res = await fetch(
				`${GRAPH_API_BASE}/${pageId}/messages?access_token=${pageAccessToken}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						recipient: { comment_id: commentId },
						messaging_type: "RESPONSE",
						message: { text },
					}),
				},
			);
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(new Error(`Private reply failed: ${res.status} ${err}`), {
					context: "facebook-channel",
				});
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: sendPrivateReply" });
			return false;
		}
	}

	/**
	 * True when the Page itself already replied under this comment.
	 * Deterministic dedupe against Meta webhook redelivery — no storage needed.
	 * Fetches up to 100 replies and follows one page of paging if needed.
	 */
	async hasPageReplied(commentId: string): Promise<boolean> {
		const pageAccessToken = this.pageAccessToken;
		if (!pageAccessToken || !this.pageId) return false;
		try {
			let url: string | null =
				`${GRAPH_API_BASE}/${commentId}/comments?fields=from{id}&limit=100&access_token=${pageAccessToken}`;
			for (let page = 0; page < 2 && url; page++) {
				const res = await fetch(url);
				if (!res.ok) return false;
				const data = (await res.json()) as {
					data?: Array<{ from?: { id?: string } }>;
					paging?: { next?: string };
				};
				if (data.data?.some((reply) => reply.from?.id === this.pageId))
					return true;
				url = data.paging?.next ?? null;
			}
			return false;
		} catch {
			return false;
		}
	}

	// ── Messenger Profile (persistent menu / get_started / greeting / ice breakers) ──
	// Docs: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api
	// Single endpoint controls the right-corner menu, Get Started, and greeting.
	// Requires page_access_token; pageId is inferred from token via `me`.

	async getMessengerProfile(
		fields: string[] = [
			"persistent_menu",
			"get_started",
			"greeting",
			"ice_breakers",
		],
	): Promise<Record<string, unknown> | null> {
		const pageAccessToken = this.pageAccessToken;
		if (!pageAccessToken) return null;
		try {
			const url = `${GRAPH_API_BASE}/me/messenger_profile?fields=${fields.join(",")}&access_token=${pageAccessToken}`;
			const res = await fetch(url);
			if (!res.ok) return null;
			return (await res.json()) as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	async setMessengerProfile(
		payload: Record<string, unknown>,
	): Promise<boolean> {
		const pageAccessToken = this.pageAccessToken;
		if (!pageAccessToken) return false;
		try {
			const url = `${GRAPH_API_BASE}/me/messenger_profile?access_token=${pageAccessToken}`;
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(new Error(`setMessengerProfile failed: ${res.status} ${err}`), {
					context: "facebook-channel",
				});
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: setMessengerProfile" });
			return false;
		}
	}

	async deleteMessengerProfile(fields: string[]): Promise<boolean> {
		const pageAccessToken = this.pageAccessToken;
		if (!pageAccessToken) return false;
		try {
			const url = `${GRAPH_API_BASE}/me/messenger_profile?access_token=${pageAccessToken}`;
			const res = await fetch(url, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fields }),
			});
			if (!res.ok) {
				const err = await res.text().catch(() => "unknown");
				capture(
					new Error(`deleteMessengerProfile failed: ${res.status} ${err}`),
					{
						context: "facebook-channel",
					},
				);
				return false;
			}
			return true;
		} catch (err) {
			capture(err, { context: "facebook-channel: deleteMessengerProfile" });
			return false;
		}
	}

	/**
	 * Set the persistent menu — the right-corner ☰ menu (mobile: hamburger).
	 * Up to 3 top-level items, each up to 5 nested. Payloads arrive as postbacks.
	 */
	async setPersistentMenu(
		items: Array<
			| { type: "postback"; title: string; payload: string }
			| { type: "web_url"; title: string; url: string }
			| {
					type: "nested";
					title: string;
					call_to_actions: Array<
						| { type: "postback"; title: string; payload: string }
						| { type: "web_url"; title: string; url: string }
					>;
			  }
		>,
		options?: { composerInputDisabled?: boolean; locale?: string },
	): Promise<boolean> {
		const locale = options?.locale ?? "default";
		const composer_input_disabled = options?.composerInputDisabled ?? false;
		// Validate limits early to avoid silent Meta truncation
		const topLevel = items.slice(0, 3);
		const normalized = topLevel.map((item) => {
			if (item.type === "nested") {
				return { ...item, call_to_actions: item.call_to_actions.slice(0, 5) };
			}
			return item;
		});
		return this.setMessengerProfile({
			persistent_menu: [
				{
					locale,
					composer_input_disabled,
					call_to_actions: normalized,
				},
			],
		});
	}

	async deletePersistentMenu(): Promise<boolean> {
		return this.deleteMessengerProfile(["persistent_menu"]);
	}

	async setGetStarted(payload = "GET_STARTED"): Promise<boolean> {
		return this.setMessengerProfile({ get_started: { payload } });
	}

	async setGreeting(text: string, locale = "default"): Promise<boolean> {
		return this.setMessengerProfile({
			greeting: [{ locale, text: text.slice(0, 160) }],
		});
	}

	async setIceBreakers(
		prompts: Array<{ question: string; payload: string }>,
		locale = "default",
	): Promise<boolean> {
		return this.setMessengerProfile({
			ice_breakers: [
				{
					locale,
					call_to_actions: prompts.slice(0, 4).map((p) => ({
						question: p.question.slice(0, 80),
						payload: p.payload.slice(0, 1000),
					})),
				},
			],
		});
	}
}
