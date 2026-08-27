import crypto from "node:crypto";
import { capture } from "@zuiio/capture";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import type { MetaWebhookPayload } from "@/channels/types";
import { handleFlowMessage } from "@/flow-executor";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { handleFeedChange } from "@/gateway/comment-agent";
import {
	createCustomerCartTools,
	loadCustomerCart,
	replayCustomerCheckoutAction,
} from "@/gateway/customer-cart-tool";
import { createCustomerProductTool } from "@/gateway/customer-product-tool";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { decryptSecret } from "@/lib/crypto";
import { formatWriteResult } from "@/lib/format-result";
import { getRedis } from "@/lib/redis";
import {
	createServiceClient,
	getSupabaseForProduct,
	type ServiceClient,
} from "@/lib/supabase";
import {
	confirmStoredAction,
	rejectStoredAction,
} from "@/runtime/confirmation";

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "";
const APP_SECRET = process.env.FB_APP_SECRET || "";

/**
 * Meta redelivers webhook deliveries when the handler does not ACK within
 * ~20s. AI agent runs regularly exceed that window, so the same event arrives
 * repeatedly and each copy used to trigger its own agent run + reply (the
 * "5x Уучлаарай" storm). Track seen event keys for a TTL window and drop
 * redeliveries before any processing (at-most-once).
 *
 * Durable path: Redis SETNX (survives serverless instance recycling).
 * In-memory Map is fallback when Redis is unavailable (dev) or fails.
 */
const SEEN_EVENT_TTL_MS = 10 * 60 * 1000;
const seenEvents = new Map<string, number>();

async function isDuplicateEvent(key: string): Promise<boolean> {
	// Durable dedupe via Redis when configured
	try {
		const redis = getRedis();
		if (redis) {
			// Upstash: SET key 1 NX EX 600 -> "OK" if set, null if exists
			const res = await redis.set(`fb:event:${key}`, "1", {
				nx: true,
				ex: Math.ceil(SEEN_EVENT_TTL_MS / 1000),
			});
			if (res === null) return true;
			if (res === "OK") return false;
		}
	} catch {
		// fall through to in-memory
	}
	const now = Date.now();
	if (seenEvents.size > 1000) {
		for (const [k, ts] of seenEvents) {
			if (now - ts > SEEN_EVENT_TTL_MS) seenEvents.delete(k);
		}
	}
	const seenAt = seenEvents.get(key);
	if (seenAt !== undefined && now - seenAt < SEEN_EVENT_TTL_MS) return true;
	seenEvents.set(key, now);
	return false;
}

/**
 * GET: Webhook verification endpoint.
 * Meta sends this when you configure the webhook URL.
 * Must respond with hub.challenge if verify_token matches.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams } = new URL(request.url);
	const mode = searchParams.get("hub.mode");
	const token = searchParams.get("hub.verify_token");
	const challenge = searchParams.get("hub.challenge");

	if (mode === "subscribe" && token === VERIFY_TOKEN) {
		return new NextResponse(challenge, { status: 200 });
	}

	return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST: Handle incoming webhook events from Messenger + Instagram.
 *
 * Security:
 * 1. Validate X-Hub-Signature-256 (HMAC-SHA256 with App Secret)
 * 2. Use constant-time comparison (crypto.timingSafeEqual)
 * 3. Use raw request body (not JSON.parse/re-stringify)
 *
 * Routing:
 * 1. Parse payload: { object: "page", entry: [...] }
 * 2. For each entry: entry.id = page_id
 * 3. Look up channel_connections by page_id
 * 4. Determine channel: "messenger" or "instagram"
 * 5. Extract sender ID from entry.messaging[0].sender.id
 * 6. Route to agent pipeline
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	// Read raw body for HMAC validation
	const rawBody = await request.text();

	// Validate signature
	const signature = request.headers.get("x-hub-signature-256");
	if (!validateSignature(rawBody, signature)) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	// Parse payload
	let payload: MetaWebhookPayload;
	try {
		payload = JSON.parse(rawBody) as MetaWebhookPayload;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	// Verify it's a page event
	if (payload.object !== "page") {
		return NextResponse.json({ ok: true });
	}

	// Process each entry (can be batched)
	const supabase = createServiceClient();

	for (const entry of payload.entry) {
		const entryId = entry.id;
		// Defense in depth: reject ids containing PostgREST filter syntax
		// (`,` `(` `)` `"` `'`) — Meta numeric ids pass, test mocks like "page-123" pass.
		if (
			typeof entryId !== "string" ||
			entryId.length === 0 ||
			/[,()"']/.test(entryId)
		) {
			continue;
		}

		// Look up org from page_id (Messenger) or IG business account id (Instagram).
		// A page can have TWO active rows (messenger + instagram) sharing page_id,
		// so never use .single() here — pick the row matching the event's channel.
		const { data: connections } = await supabase
			.from("channel_connections")
			.select("*")
			.eq("is_active", true)
			.or(
				`page_id.eq.${entryId},and(channel.eq.instagram,channel_user_id.eq.${entryId})`,
			);
		if (!connections || connections.length === 0) {
			// Unknown page — skip silently
			continue;
		}

		// Process each messaging event
		const messagingEvents = entry.messaging ?? [];
		for (const event of messagingEvents) {
			// Skip echo messages (sent by the page itself)
			if (event.message?.is_echo) continue;

			const senderId = event.sender.id;
			const dedupeKey =
				event.message?.mid ??
				`${senderId}:${event.timestamp}:${event.postback?.payload ?? ""}`;
			if (await isDuplicateEvent(dedupeKey)) continue;
			// Instagram entries carry the IG business account id; Messenger entries
			// carry the page id. Prefer the instagram row when entry.id matches the
			// stored IG account id, otherwise use the messenger row.
			const instagramConnection = connections.find(
				(c) => c.channel === "instagram" && c.channel_user_id === entryId,
			);
			const messengerConnection = connections.find(
				(c) => c.channel === "messenger" && c.page_id === entryId,
			);
			const connection = instagramConnection ?? messengerConnection;
			if (!connection) continue;

			const channel = instagramConnection ? "instagram" : "messenger";

			// Tokens are stored encrypted (encryptSecret) — decrypt once per event.
			const pageAccessToken = decryptSecret(connection.page_access_token ?? "");

			// entryId is the correct Graph API recipient id for both channels:
			// FB page id for Messenger events, IG business account id for Instagram.
			// It also serves as the stable session-chat key per channel.
			const pageId = entryId;

			// Dispatch the event. A Meta messaging event carries exactly one of:
			// postback (button click), quick_reply payload, or plain text — but a
			// quick reply ALSO carries message.text (the displayed label), so
			// these branches MUST be exclusive or the message is processed twice
			// (double agent call, double reply, double rate-limit/budget spend).

			// Handle postbacks (button clicks)
			if (event.postback?.payload) {
				await handlePostback(supabase, {
					pageId,
					senderId,
					channel,
					payload: event.postback.payload,
					pageAccessToken,
					orgId: connection.organization_id,
					userId: connection.user_id ?? senderId,
					productType: connection.product_type as "tolom" | "zer",
				});
			} else if (event.message?.quick_reply?.payload) {
				// Handle quick reply payloads
				await handleQuickReply(supabase, {
					pageId,
					senderId,
					channel,
					payload: event.message.quick_reply.payload,
					pageAccessToken,
					orgId: connection.organization_id,
					userId: connection.user_id ?? senderId,
					productType: connection.product_type as "tolom" | "zer",
				});
			} else if (event.message?.text) {
				// Handle text messages
				await handleMessage(supabase, {
					pageId,
					senderId,
					channel,
					text: event.message.text,
					pageAccessToken,
					orgId: connection.organization_id,
					userId: connection.user_id ?? senderId,
					productType: connection.product_type as "tolom" | "zer",
				});
			}

			// Update last_user_message_at for 24h window tracking
			await supabase
				.from("channel_connections")
				.update({ last_user_message_at: new Date().toISOString() })
				.eq("id", connection.id);
		}
		// Process Page feed changes (comments on posts). Feed events carry the
		// page id in entry.id, so they route to the messenger connection.
		const messengerConn = connections.find(
			(c) => c.channel === "messenger" && c.page_id === entryId,
		);
		if (messengerConn && entry.changes && entry.changes.length > 0) {
			const feedCtx = {
				pageId: entryId,
				pageAccessToken: decryptSecret(messengerConn.page_access_token ?? ""),
				orgId: messengerConn.organization_id,
				userId: messengerConn.user_id ?? entryId,
				productType: messengerConn.product_type as "tolom" | "zer" | "zatly",
				connectionId: messengerConn.id,
			};
			for (const change of entry.changes) {
				// Meta can redeliver feed changes independently of messaging
				// events. Deduplicate before invoking the AI/reply path.
				const value = change.value;
				const feedKey =
					value.comment_id ??
					`${value.item}:${value.verb}:${value.post_id ?? ""}:${value.created_time ?? ""}`;
				if (await isDuplicateEvent(`feed:${entryId}:${feedKey}`)) continue;
				await handleFeedChange(supabase, feedCtx, change);
			}
		}
	}

	return NextResponse.json({ ok: true });
}

/**
 * Validate X-Hub-Signature-256 using HMAC-SHA256.
 * Uses constant-time comparison to prevent timing attacks.
 */
function validateSignature(rawBody: string, signature: string | null): boolean {
	if (!signature || !APP_SECRET) return false;

	const expectedSignature = crypto
		.createHmac("sha256", APP_SECRET)
		.update(rawBody, "utf8")
		.digest("hex");

	const expected = `sha256=${expectedSignature}`;

	// Constant-time comparison
	try {
		return crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(expected),
		);
	} catch {
		return false;
	}
}

function quickRepliesForCustomerMessage(
	text: string,
	channel: "messenger" | "instagram",
	opts?: { hasProducts?: boolean; isCart?: boolean; isCheckout?: boolean },
): Array<{ text: string; callbackData: string }> | undefined {
	if (channel !== "messenger" && channel !== "instagram") return undefined;
	if (opts?.hasProducts) {
		return [
			{ text: "Сагс үзэх", callbackData: "cart_view" },
			{ text: "Захиалах", callbackData: "checkout" },
			{ text: "Үргэлжлүүлэн үзэх", callbackData: "catalog" },
		];
	}
	if (opts?.isCart || opts?.isCheckout) {
		return [
			{ text: "Захиалах", callbackData: "checkout" },
			{ text: "Сагс цэвэрлэх", callbackData: "clear_cart" },
			{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
		];
	}
	const t = text.trim().toLowerCase();
	if (/сагс|cart/.test(t)) {
		return [
			{ text: "Захиалах", callbackData: "checkout" },
			{ text: "Сагс цэвэрлэх", callbackData: "clear_cart" },
			{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
		];
	}
	if (/захиалга|order/.test(t)) {
		return [
			{ text: "Захиалга шалгах", callbackData: "order_status" },
			{ text: "Хүргэлт асуух", callbackData: "delivery" },
			{ text: "Дэмжлэг", callbackData: "support" },
		];
	}
	if (/^(сайн|hello|hi|hey|сайн уу)/i.test(text.trim())) {
		return [
			{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
			{ text: "Захиалга шалгах", callbackData: "order_status" },
			{ text: "Хүргэлт асуух", callbackData: "delivery" },
		];
	}
	return [
		{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
		{ text: "Сагс харах", callbackData: "cart_view" },
		{ text: "Захиалга шалгах", callbackData: "order_status" },
	];
}

interface MessageContext {
	pageId: string;
	senderId: string;
	channel: "messenger" | "instagram";
	text: string;
	pageAccessToken: string;
	orgId: string;
	userId: string;
	productType: "tolom" | "zer";
}

/**
 * Handle incoming text message from Messenger/Instagram.
 */
async function handleMessage(
	supabase: ServiceClient,
	ctx: MessageContext,
): Promise<void> {
	const channel = new FacebookChannel({
		pageId: ctx.pageId,
		pageAccessToken: ctx.pageAccessToken,
	});

	try {
		// Check 24h messaging window against the per-sender session, which is keyed
		// by (org, channel, chat, user) — the old channel_connections lookup compared
		// against channel_user_id (= page id) and could never match a sender PSID.
		const { data: session } = await supabase
			.from("agent_sessions")
			.select("updated_at")
			.eq("organization_id", ctx.orgId)
			.eq("channel", ctx.channel)
			.eq("channel_chat_id", ctx.pageId)
			.eq("channel_user_id", ctx.senderId)
			.maybeSingle();

		if (session?.updated_at) {
			const hoursSinceLastMessage =
				(Date.now() - new Date(session.updated_at as string).getTime()) /
				(1000 * 60 * 60);

			if (hoursSinceLastMessage > 24) {
				await channel.sendMessage(
					ctx.senderId,
					"Бидэнтэй харилцахаар ахиад мессеж бичнэ үү. 😊",
				);
				return;
			}
		}

		const dataClient =
			ctx.productType === "tolom" ? getSupabaseForProduct("tolom") : supabase;

		// Show typing indicator while processing
		await channel.sendSenderAction(ctx.senderId, "typing_on");
		// Build gateway context for flow routing and agent handler
		const gatewayCtx = {
			supabase: dataClient,
			orgId: ctx.orgId,
			userId: ctx.userId,
			productType: ctx.productType,
			// Public customer channels — fail closed to the customer tool set.
			audience: "customer" as const,
			chatId: 0,
			telegramUserId: 0,
			channel: ctx.channel,
			channelChatId: ctx.pageId,
			channelUserId: ctx.senderId,
			pageId: ctx.pageId,
			pageAccessToken: ctx.pageAccessToken,
		};

		// Try flow routing first — if a flow is active or triggered, handle it
		const flowResult = await handleFlowMessage(
			gatewayCtx,
			ctx.text,
			supabase,
			channel,
		);

		if (flowResult) {
			// Flow handled the message — hide typing and return
			await channel.sendSenderAction(ctx.senderId, "typing_off");
			return;
		}

		if (
			ctx.productType === "zer" &&
			ctx.channel === "messenger" &&
			/(бараа|бүтээгдэхүүн|үнэ|зарах|байгаа юу|жагсаалт|каталог)/i.test(
				ctx.text,
			)
		) {
			const wantsCatalogList =
				/жагсаалт|каталог|юу байгаа|байгаа юу|бүгд/i.test(ctx.text);
			const productResult = await createCustomerProductTool({
				supabase: dataClient,
				orgId: ctx.orgId,
				userId: ctx.senderId,
			}).execute(
				{ query: wantsCatalogList ? "" : ctx.text, limit: 10 },
				gatewayCtx,
			);
			const products =
				typeof productResult === "object" &&
				productResult !== null &&
				"products" in productResult &&
				Array.isArray(productResult.products)
					? (productResult.products as Array<{
							id: string;
							name: string;
							description?: string | null;
							salePrice?: number | null;
							currentStock?: number | null;
							imageUrl?: string | null;
						}>)
					: [];
			if (products.length > 0) {
				await channel.sendSenderAction(ctx.senderId, "typing_off");
				await channel.sendMessage(ctx.senderId, "Таны асуусан бараанууд:");
				const cardsSent = await channel.sendProductCards(ctx.senderId, products);
				if (cardsSent) {
					const qr = quickRepliesForCustomerMessage(ctx.text, ctx.channel, {
						hasProducts: true,
					});
					if (qr && qr.length > 0) {
						await channel.sendMessage(
							ctx.senderId,
							"Танд өөр ямар тусламж хэрэгтэй вэ?",
							{ quickReplies: qr },
						);
					}
				}
				return;
			}
		}

		// No flow matched — fall through to AI agent handler
		// Capture searchProducts results so we can render them as horizontal cards on Messenger
		let capturedProducts: unknown = null;
		const response = await handleAgentMessage(gatewayCtx, ctx.text, "private", {
			getSystemPrompt: systemPromptFor,
			getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
			dataClient,
			onToolResult: (toolName, result) => {
				if (
					toolName === "searchProducts" &&
					result !== null &&
					typeof result === "object" &&
					"products" in result
				) {
					const prods = (result as { products: unknown }).products;
					if (Array.isArray(prods) && prods.length > 0) {
						capturedProducts = prods;
					}
				}
			},
		});
		// Hide typing indicator
		await channel.sendSenderAction(ctx.senderId, "typing_off");

		// If the LLM called searchProducts on Messenger, render the result as
		// horizontally scrollable Generic Template cards instead of a plain text list.
		if (
			Array.isArray(capturedProducts) &&
			capturedProducts.length > 0 &&
			ctx.channel === "messenger"
		) {
			let intro = response.trim();
			// The Messenger prompt tells the model to give only a brief intro,
			// but guard against older prompts / long enumerated lists.
			const hasEnumeratedList =
				/\n\s*\d+\./.test(intro) || /\n\s*[-•]/.test(intro);
			if (hasEnumeratedList) {
				const firstLine = intro.split("\n")[0]?.trim() ?? "";
				intro = firstLine.length >= 10 ? firstLine : "Таны хайсан бараанууд:";
			}
			if (!intro) intro = "Таны хайсан бараанууд:";
			await channel.sendMessage(ctx.senderId, intro);
			const cardsSent = await channel.sendProductCards(
				ctx.senderId,
				capturedProducts as Array<{
					id: string;
					name: string;
					description?: string | null;
					salePrice?: number | null;
					currentStock?: number | null;
					imageUrl?: string | null;
				}>,
			);
			if (cardsSent) {
				const qr = quickRepliesForCustomerMessage(ctx.text, ctx.channel, {
					hasProducts: true,
				});
				if (qr && qr.length > 0) {
					await channel.sendMessage(
						ctx.senderId,
						"Танд өөр ямар тусламж хэрэгтэй вэ?",
						{ quickReplies: qr },
					);
				}
				return;
			}
			// Cards failed (e.g. Instagram, missing token, API error) — fall back to plain text
			await channel.sendMessage(ctx.senderId, response, {
				quickReplies: quickRepliesForCustomerMessage(ctx.text, ctx.channel),
			});
			return;
		}

		// No products — normal text reply
		await channel.sendMessage(ctx.senderId, response, {
			quickReplies: quickRepliesForCustomerMessage(ctx.text, ctx.channel),
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: facebook handleMessage" });
		await channel.sendMessage(
			ctx.senderId,
			"Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.",
		);
	}
}

interface PostbackContext {
	pageId: string;
	senderId: string;
	channel: "messenger" | "instagram";
	payload: string;
	pageAccessToken: string;
	orgId: string;
	userId: string;
	productType: "tolom" | "zer";
}

/**
 * Handle postback (button click) from Messenger.
 */
async function handlePostback(
	supabase: ServiceClient,
	ctx: PostbackContext,
): Promise<void> {
	const channel = new FacebookChannel({
		pageId: ctx.pageId,
		pageAccessToken: ctx.pageAccessToken,
	});

	if (ctx.payload.startsWith("confirm:")) {
		const confirmId = ctx.payload.replace("confirm:", "");
		const staged = await confirmStoredAction(
			confirmId,
			ctx.orgId,
			ctx.pageId,
			ctx.senderId,
		);
		if (!staged) {
			await channel.sendMessage(
				ctx.senderId,
				"Энэ үйлдлийн хугацаа дууссан эсвэл буруу байна.",
			);
			return;
		}

		try {
			let result: unknown;
			if (
				staged.persistent &&
				(staged.toolName === "placeOrderWithQpay" ||
					staged.toolName === "checkoutCartWithQpay")
			) {
				const actionContext = {
					orgId: ctx.orgId,
					userId: ctx.senderId,
					supabase,
					productType: ctx.productType,
					audience: "customer" as const,
					channel: ctx.channel,
					channelChatId: ctx.pageId,
					channelUserId: ctx.senderId,
					pageId: ctx.pageId,
					pageAccessToken: ctx.pageAccessToken,
					replaying: true,
				};
				result = await replayCustomerCheckoutAction(
					staged.toolName,
					staged.args,
					actionContext,
				);
			} else if (staged.execute) {
				result = await staged.execute(staged.args);
			} else {
				result = { success: true, message: "Амжилттай." };
			}
			const isOrderCheckout =
				staged.toolName === "placeOrderWithQpay" ||
				staged.toolName === "checkoutCartWithQpay";
			const followUps = isOrderCheckout
				? [
						{ text: "Захиалга шалгах", callbackData: "order_status" },
						{ text: "Сагс харах", callbackData: "cart_view" },
						{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
					]
				: [
						{ text: "Сагс харах", callbackData: "cart_view" },
						{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
					];
			await channel.sendMessage(ctx.senderId, formatWriteResult(result), {
				quickReplies: followUps,
			});
			// If the order returned a QPay QR image, send it as an image attachment
			if (
				result !== null &&
				typeof result === "object" &&
				"payment_method" in result &&
				"qpay_qr_image" in result
			) {
				const record = result as Record<string, unknown>;
				if (record.payment_method === "qpay") {
					const qrImage = record.qpay_qr_image;
					if (typeof qrImage === "string" && qrImage.trim()) {
						try {
							await channel.sendImage?.(ctx.senderId, qrImage);
						} catch {}
					}
				}
			}
		} catch (err) {
			capture(err, { context: "agent-gateway: confirm staged action (meta)" });
			await channel.sendMessage(
				ctx.senderId,
				"Уучлаарай, үйлдлийг гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.",
			);
		}
		return;
	}

	if (ctx.payload.startsWith("reject:")) {
		await rejectStoredAction(ctx.payload.replace("reject:", ""));
		await channel.sendMessage(ctx.senderId, "❌ Цуцаллаа.");
		return;
	}

	if (ctx.payload.startsWith("PRODUCT:")) {
		const productId = ctx.payload.slice("PRODUCT:".length).trim();
		if (productId) {
			try {
				const dataClient =
					ctx.productType === "tolom"
						? getSupabaseForProduct("tolom")
						: supabase;
				const { data: product } = await dataClient
					.from("products")
					.select(
						"id, name, description, sale_price, current_stock, image_url, image_urls",
					)
					.eq("id", productId)
					.eq("organization_id", ctx.orgId)
					.maybeSingle();
				if (product) {
					const rawImageUrl = product.image_url as string | null;
					const rawImageUrls = product.image_urls as unknown;
					let resolvedImageUrl: string | null = rawImageUrl;
					if (
						!resolvedImageUrl &&
						typeof rawImageUrls === "string" &&
						rawImageUrls
					) {
						try {
							const parsed = JSON.parse(rawImageUrls) as unknown;
							if (Array.isArray(parsed) && parsed.length > 0)
								resolvedImageUrl = String(parsed[0]);
						} catch {
							const first = rawImageUrls.split(",")[0]?.trim();
							if (first) resolvedImageUrl = first;
						}
					} else if (
						!resolvedImageUrl &&
						Array.isArray(rawImageUrls) &&
						rawImageUrls.length > 0
					) {
						resolvedImageUrl = String(rawImageUrls[0]);
					}
					await channel.sendMessage(
						ctx.senderId,
						`📦 <b>${product.name}</b>${product.description ? `\n\n${product.description.slice(0, 500)}` : ""}\n\nҮнэ: <b>₮${(product.sale_price as number | null)?.toLocaleString("mn-MN") ?? "—"}</b>\nҮлдэгдэл: ${product.current_stock != null ? ((product.current_stock as number) > 0 ? `${product.current_stock} ширхэг` : "Дууссан") : "—"}`,
					);
					await channel.sendProductCards(ctx.senderId, [
						{
							id: product.id as string,
							name: product.name as string,
							description: product.description as string | null,
							salePrice: product.sale_price as number | null,
							currentStock: product.current_stock as number | null,
							imageUrl: resolvedImageUrl,
						},
					]);
					await channel.sendMessage(ctx.senderId, "Сагсанд нэмэх үү?", {
						quickReplies: [
							{
								text: "Сагсанд нэмэх",
								callbackData: `CART_ADD:${product.id}`,
							},
							{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
						],
					});
				} else {
					await channel.sendMessage(ctx.senderId, "Бараа олдсонгүй.");
				}
			} catch (err) {
				capture(err, { context: "agent-gateway: product detail postback" });
				await channel.sendMessage(
					ctx.senderId,
					"Барааны мэдээлэл авахад алдаа гарлаа.",
				);
			}
		}
		return;
	}

	if (ctx.payload.startsWith("CART_ADD:")) {
		const productId = ctx.payload.slice("CART_ADD:".length).trim();
		if (productId) {
			try {
				const dataClient =
					ctx.productType === "tolom"
						? getSupabaseForProduct("tolom")
						: supabase;
				const toolCtx = {
					supabase: dataClient,
					orgId: ctx.orgId,
					userId: ctx.senderId,
					productType: ctx.productType,
					audience: "customer" as const,
					channel: ctx.channel,
					channelChatId: ctx.pageId,
					channelUserId: ctx.senderId,
					pageId: ctx.pageId,
					pageAccessToken: ctx.pageAccessToken,
				};
				const cartTools = createCustomerCartTools(toolCtx);
				const addToCart = cartTools[0];
				if (!addToCart) {
					await channel.sendMessage(ctx.senderId, "Сагс үйлчилгээ боломжгүй.");
					return;
				}
				const result = await addToCart.execute(
					{ product_id: productId, quantity: 1 },
					toolCtx,
				);
				if (
					result !== null &&
					typeof result === "object" &&
					"error" in result
				) {
					await channel.sendMessage(
						ctx.senderId,
						String((result as { error: string }).error),
					);
				} else {
					await channel.sendMessage(
						ctx.senderId,
						"✅ Сагсанд нэмлээ! Үргэлжлүүлэн дэлгүүр хэсэх үү?",
						{
							quickReplies: [
								{ text: "Сагс үзэх", callbackData: "cart_view" },
								{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
								{ text: "Захиалах", callbackData: "checkout" },
							],
						},
					);
				}
			} catch (err) {
				capture(err, { context: "agent-gateway: cart add postback" });
				await channel.sendMessage(
					ctx.senderId,
					"Сагсанд нэмэхэд алдаа гарлаа.",
				);
			}
		}
		return;
	}

	if (ctx.payload.startsWith("BUY:")) {
		const productId = ctx.payload.slice("BUY:".length).trim();
		if (productId) {
			try {
				const dataClient =
					ctx.productType === "tolom"
						? getSupabaseForProduct("tolom")
						: supabase;
				const { data: product } = await dataClient
					.from("products")
					.select("id, name")
					.eq("id", productId)
					.eq("organization_id", ctx.orgId)
					.maybeSingle();
				const productName = (product?.name as string | null) ?? "барааг";
				await handleMessage(supabase, {
					...ctx,
					text: `${productName} худалдаж авах хүсэлтэй байна. 1 ширхэг. Захиалга үүсгэхэд туслаач.`,
				});
			} catch (err) {
				capture(err, { context: "agent-gateway: buy postback" });
				await handleMessage(supabase, {
					...ctx,
					text: `BUY:${productId} худалдаж авах`,
				});
			}
		}
		return;
	}
	if (ctx.payload === "catalog") {
		await handleMessage(supabase, { ...ctx, text: "жагсаалт" });
		return;
	}
	// Cart view — deterministic enriched render (no LLM round-trip)
	// Persistent-menu "Сагс" uses payload CART_VIEW; quick-replies use cart_view/view_cart
	const cartPayload = ctx.payload.trim().toLowerCase();
	if (
		cartPayload === "cart_view" ||
		cartPayload === "view_cart" ||
		cartPayload === "cart" ||
		cartPayload === "сагс" ||
		cartPayload === "сагс үзэх"
	) {
		try {
			const dataClient =
				ctx.productType === "tolom" ? getSupabaseForProduct("tolom") : supabase;
			const toolCtx = {
				supabase: dataClient,
				orgId: ctx.orgId,
				userId: ctx.senderId,
				productType: ctx.productType,
				audience: "customer" as const,
				channel: ctx.channel,
				channelChatId: ctx.pageId,
				channelUserId: ctx.senderId,
				pageId: ctx.pageId,
				pageAccessToken: ctx.pageAccessToken,
			};
			const cart = await loadCustomerCart(toolCtx);
			if (cart.items.length === 0) {
				await channel.sendMessage(
					ctx.senderId,
					'🛒 Сагс хоосон байна.\n\nБараа нэмэхийг хүсвэл "жагсаалт" гэж бичнэ үү.',
					{
						quickReplies: [
							{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
						],
					},
				);
				return;
			}
			// Enrich with product names/prices
			const productIds = cart.items.map((item) => item.product_id);
			const { data: products } = await dataClient
				.from("products")
				.select("id, name, sale_price")
				.eq("organization_id", ctx.orgId)
				.in("id", productIds);
			const productMap = new Map(
				(products ?? []).map((product) => [
					product.id as string,
					product as { id: string; name: string; sale_price: number | null },
				]),
			);
			let total = 0;
			const lines = cart.items.map((item, index) => {
				const product = productMap.get(item.product_id);
				const name = product?.name ?? item.product_id.slice(0, 8);
				const price = product?.sale_price ?? 0;
				const subtotal = price * item.quantity;
				total += subtotal;
				return `${index + 1}. ${name} — ${item.quantity}ш × ₮${price.toLocaleString("mn-MN")} = ₮${subtotal.toLocaleString("mn-MN")}`;
			});
			const message = `🛒 Таны сагс (${cart.items.length} төрөл):\n\n${lines.join("\n")}\n\nНийт: ₮${total.toLocaleString("mn-MN")}`;
			await channel.sendMessage(ctx.senderId, message, {
				quickReplies: [
					{ text: "Захиалах", callbackData: "checkout" },
					{ text: "Сагс цэвэрлэх", callbackData: "clear_cart" },
					{ text: "Үргэлжлүүлэн үзэх", callbackData: "catalog" },
				],
			});
		} catch (err) {
			capture(err, { context: "agent-gateway: cart view postback" });
			// Fallback to LLM path
			await handleMessage(supabase, { ...ctx, text: "сагс үзэх" });
		}
		return;
	}
	if (cartPayload === "clear_cart") {
		try {
			const dataClient =
				ctx.productType === "tolom" ? getSupabaseForProduct("tolom") : supabase;
			const toolCtx = {
				supabase: dataClient,
				orgId: ctx.orgId,
				userId: ctx.senderId,
				productType: ctx.productType,
				audience: "customer" as const,
				channel: ctx.channel,
				channelChatId: ctx.pageId,
				channelUserId: ctx.senderId,
				pageId: ctx.pageId,
				pageAccessToken: ctx.pageAccessToken,
			};
			const cartTools = createCustomerCartTools(toolCtx);
			const clearCart = cartTools.find((tool) => tool.name === "clearCart");
			if (clearCart) await clearCart.execute({}, toolCtx);
			await channel.sendMessage(ctx.senderId, "🗑️ Сагс цэвэрлэгдлээ.");
		} catch (err) {
			capture(err, { context: "agent-gateway: clear cart postback" });
			await channel.sendMessage(ctx.senderId, "Сагс цэвэрлэхэд алдаа гарлаа.");
		}
		return;
	}
	if (ctx.payload === "checkout") {
		await handleMessage(supabase, { ...ctx, text: "захиалах" });
		return;
	}
	await handleMessage(supabase, { ...ctx, text: ctx.payload });
}

interface QuickReplyContext {
	pageId: string;
	senderId: string;
	channel: "messenger" | "instagram";
	payload: string;
	pageAccessToken: string;
	orgId: string;
	userId: string;
	productType: "tolom" | "zer";
}

/**
 * Handle quick reply payload from Messenger/Instagram.
 */
async function handleQuickReply(
	supabase: ServiceClient,
	ctx: QuickReplyContext,
): Promise<void> {
	// Delegate to postback handler (same logic)
	await handlePostback(supabase, ctx);
}
