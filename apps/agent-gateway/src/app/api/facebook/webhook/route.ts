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
import {
	buildQpayBankQuickReplies,
	formatBankPaymentMessage,
	type QpayBankUrl,
	resolveBankDeeplink,
} from "@/gateway/qpay-helpers";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { decryptSecret } from "@/lib/crypto";
import { formatWriteResult } from "@/lib/format-result";
import { getRedis } from "@/lib/redis";
import {
	createServiceClient,
	getSupabaseForProduct,
	type ServiceClient,
} from "@/lib/supabase";
import { verifyCompactToken } from "@/lib/tokens";
import {
	createTraceLogger,
	generateTraceId,
	type TraceLogger,
} from "@/lib/trace";

async function captureConsent(
	supabase: ServiceClient,
	organizationId: string,
	channel: string,
	channelUserId: string,
	pageId: string,
	granted: boolean,
	source: "quick_reply" | "postback" | "ref",
) {
	const values = {
		organization_id: organizationId,
		channel,
		channel_user_id: channelUserId,
		page_id: pageId,
		consent_type: "broadcast",
		source,
		revoked_at: granted ? null : new Date().toISOString(),
	};
	const { error } = await supabase.from("user_consents").upsert(values, {
		onConflict: "organization_id,channel,channel_user_id,page_id,consent_type",
	});
	if (error) {
		capture(error, { context: "agent-gateway: captureConsent upsert" });
	}
}

import {
	confirmStoredAction,
	rejectStoredAction,
} from "@/runtime/confirmation";

function sanitizeReferralToken(value: unknown): string {
	return (
		String(value ?? "")
			.replace(/[^\w-]/g, "")
			.slice(0, 64) || "unknown"
	);
}

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
	const rootTraceId =
		request.headers.get("x-vercel-id")?.split(":")[0] ??
		request.headers.get("x-request-id") ??
		generateTraceId();
	const deploymentId =
		process.env.VERCEL_DEPLOYMENT_ID ??
		process.env.VERCEL_GIT_COMMIT_SHA ??
		null;
	const rootTrace = createTraceLogger({
		traceId: rootTraceId,
		channel: "messenger",
		requestText: `webhook entries=${payload.entry.length}`,
		requestId: rootTraceId,
		deploymentId,
	});
	rootTrace.log("info", "facebook webhook POST", {
		entries: payload.entry.length,
		object: payload.object,
	});

	for (const entry of payload.entry) {
		const entryId = entry.id;
		// Defense in depth: reject ids containing PostgREST filter syntax
		// (`,` `(` `)` `"` `'`) — Meta numeric ids pass, test mocks like "page-123" pass.
		if (
			typeof entryId !== "string" ||
			entryId.length === 0 ||
			/[,()"']/.test(entryId)
		) {
			rootTrace.log("info", "skipping invalid entry id");
			rootTrace.flush();
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
			rootTrace.log("info", "skipping unknown page", { entryId });
			rootTrace.flush();
			continue;
		}

		// Handover Protocol events arrive in the `standby` array when another
		// Meta app has thread control. Persist them so the team inbox can claim
		// the conversation instead of sending an automated reply.
		const standbyEvents =
			(
				entry as unknown as {
					standby?: Array<{
						sender?: { id?: string };
						recipient?: { id?: string };
						timestamp?: number;
						message?: { text?: string; mid?: string; is_echo?: boolean };
					}>;
				}
			).standby ?? [];
		for (const standby of standbyEvents) {
			const standbySender = standby.sender?.id;
			const standbyText = standby.message?.text;
			if (!standbySender || !standbyText || standby.message?.is_echo === true)
				continue;
			const standbyConnection = connections.find(
				(c) =>
					(c.channel === "instagram" && c.channel_user_id === entryId) ||
					(c.channel === "messenger" && c.page_id === entryId),
			);
			if (!standbyConnection) continue;
			const standbyKey = `standby:${entryId}:${standbySender}:${standby.timestamp ?? standby.message?.mid ?? standbyText}`;
			if (await isDuplicateEvent(standbyKey)) continue;
			await supabase.from("agent_handoff_events").insert({
				organization_id: standbyConnection.organization_id,
				chat_id: entryId,
				user_id: standbySender,
				status: "pending_human",
				reason: "Meta thread control standby",
				escalated_by: "meta_standby",
				customer_query: standbyText,
				bot_response: null,
				channel: standbyConnection.channel,
			});
		}

		// Echoes are messages sent by the Page (including manual replies). They
		// must be reconciled for the audit trail, but never enter the agent,
		// flow, or customer-window pipelines.
		const messagingEvents = entry.messaging ?? [];
		for (const event of messagingEvents) {
			const echo = event.message?.is_echo === true;
			const senderId = event.sender.id;
			if (echo) {
				const mid = event.message?.mid;
				if (!mid || (await isDuplicateEvent(mid))) continue;
				const echoConnection = connections.find(
					(c) =>
						(c.channel === "instagram" && c.channel_user_id === entryId) ||
						(c.channel === "messenger" && c.page_id === entryId),
				);
				if (!echoConnection) continue;
				await supabase.from("agent_audit_log").insert({
					organization_id: echoConnection.organization_id,
					user_id: event.recipient?.id ?? entryId,
					channel: echoConnection.channel,
					channel_chat_id: entryId,
					channel_user_id: event.recipient?.id ?? entryId,
					tool_name: "message_echoes",
					tool_args: {
						page_id: entryId,
						sender_id: senderId,
						mid,
						text: event.message?.text ?? null,
					},
					tool_result: null,
					error: null,
					duration_ms: 0,
				});
				continue;
			}

			const dedupeKey = event.referral
				? `ref:${senderId}:${sanitizeReferralToken(event.referral.ref)}:${event.referral.ad_id ?? ""}`
				: (event.message?.mid ??
					`${senderId}:${event.timestamp}:${event.postback?.payload ?? ""}`);
			if (await isDuplicateEvent(dedupeKey)) continue;
			// Instagram entries carry the IG business account id; Messenger entries
			// carry the page id. Prefer the instagram row when entry.id matches the
			// stored IG account id, otherwise use the messenger row.
			const instagramConnection = connections.find(
				(c) => c.channel === "instagram" && c.channel_user_id === entryId,
			);
			const messengerConnections = connections.filter(
				(c) => c.channel === "messenger" && c.page_id === entryId,
			);
			if (messengerConnections.length > 1) {
				capture(new Error("Duplicate active Messenger channel connections"), {
					context: "agent-gateway: duplicate channel_connections",
					pageId: entryId,
					connectionIds: messengerConnections.map((c) => c.id),
				});
			}
			const messengerConnection = messengerConnections.sort(
				(a, b) =>
					new Date(b.created_at ?? 0).getTime() -
					new Date(a.created_at ?? 0).getTime(),
			)[0];
			const connection = instagramConnection ?? messengerConnection;

			if (!connection) continue;
			const channel = instagramConnection ? "instagram" : "messenger";
			const accountLinking = event.account_linking;
			if (accountLinking) {
				const code = accountLinking.authorization_code;
				const token = code?.startsWith("link_") ? code.slice(5) : code;
				const linkPayload = token ? verifyCompactToken(token) : null;
				if (
					!token ||
					!linkPayload ||
					linkPayload.orgId !== connection.organization_id ||
					linkPayload.productType !== connection.product_type ||
					accountLinking.status !== "linked"
				)
					continue;
				const tokenHash = crypto
					.createHash("sha256")
					.update(token)
					.digest("hex");
				if (
					await isDuplicateEvent(
						`account-link:${entryId}:${senderId}:${tokenHash}`,
					)
				)
					continue;
				const { error: linkError } = await supabase
					.from("linked_accounts")
					.insert({
						organization_id: linkPayload.orgId,
						channel,
						channel_user_id: senderId,
						user_id: linkPayload.userId,
						authorization_token_hash: tokenHash,
					});
				if (linkError && linkError.code !== "23505") {
					capture(linkError, { context: "agent-gateway: account linking" });
				}
				continue;
			}

			// Tokens are stored encrypted (encryptSecret) — decrypt once per event.
			const pageAccessToken = decryptSecret(connection.page_access_token ?? "");

			// entryId is the correct Graph API recipient id for both channels:
			// FB page id for Messenger events, IG business account id for Instagram.
			// It also serves as the stable session-chat key per channel.
			const pageId = entryId;

			const traceId = `${rootTraceId}-${senderId}-${event.timestamp}`;
			const requestText =
				event.postback?.payload ??
				event.message?.quick_reply?.payload ??
				event.message?.text ??
				"";
			const trace = createTraceLogger({
				traceId,
				organizationId: connection.organization_id,
				channel,
				channelChatId: pageId,
				channelUserId: senderId,
				requestText,
				requestId: rootTraceId,
				deploymentId,
			});
			trace.log("info", "facebook event dispatch", {
				type: event.postback
					? "postback"
					: event.message?.quick_reply
						? "quick_reply"
						: "text",
				requestText: requestText.slice(0, 200),
			});

			// Dispatch the event. A Meta messaging event carries exactly one of:
			// Referrals are attribution events, not ordinary text/postbacks.
			// Persist and trigger the starter flow independently; failures must not
			// prevent Meta from receiving a successful webhook acknowledgement.
			if (event.referral) {
				try {
					// Try to redeem compact link token first — raw value, before sanitize removes "."
					const rawRef = String(event.referral.ref ?? "");
					if (rawRef.startsWith("link_")) {
						const token = rawRef.slice(5);
						const linkPayload = verifyCompactToken(token);
						if (
							linkPayload &&
							linkPayload.orgId === connection.organization_id &&
							linkPayload.productType === connection.product_type
						) {
							const tokenHash = crypto
								.createHash("sha256")
								.update(token)
								.digest("hex");
							if (
								!(await isDuplicateEvent(
									`account-link:${pageId}:${senderId}:${tokenHash}`,
								))
							) {
								const { error: linkError } = await supabase
									.from("linked_accounts")
									.insert({
										organization_id: linkPayload.orgId,
										channel,
										channel_user_id: senderId,
										user_id: linkPayload.userId,
										authorization_token_hash: tokenHash,
									});
								if (linkError && linkError.code !== "23505") {
									capture(linkError, {
										context: "agent-gateway: referral link redeem",
									});
								}
							}
							// Do not route verified link token into LLM starter flow
							// Optionally thank user, but avoid leaking token
							await handleMessage(supabase, {
								pageId,
								senderId,
								channel,
								text: "Холболт амжилттай — баярлалаа!",
								pageAccessToken,
								orgId: connection.organization_id,
								userId: linkPayload.userId,
								productType: connection.product_type as "tolom" | "zer",
								trace,
							});
							// Continue to next event without generic referral insert
							trace.log("info", "referral compact token redeemed", { channel });
						} else {
							// Invalid/expired token — fall through to generic referral handling with sanitized ref
							const safeRef = sanitizeReferralToken(rawRef);
							const safeSource = sanitizeReferralToken(event.referral.source);
							await supabase.from("referral_events").insert({
								organization_id: connection.organization_id,
								channel,
								page_id: pageId,
								sender_id: senderId,
								ref: safeRef,
								source: safeSource,
								type: event.referral.type,
								ad_id: event.referral.ad_id ?? null,
							});
							await handleMessage(supabase, {
								pageId,
								senderId,
								channel,
								text: `Хэрэглэгч ${safeRef} эх үүсвэрээс орлоо (${safeSource}) — тохирох эхлэл урсгалыг эхлүүл`,
								pageAccessToken,
								orgId: connection.organization_id,
								userId: connection.user_id ?? senderId,
								productType: connection.product_type as "tolom" | "zer",
								trace,
							});
						}
					} else {
						const safeRef = sanitizeReferralToken(rawRef);
						const safeSource = sanitizeReferralToken(event.referral.source);
						const { error: referralError } = await supabase
							.from("referral_events")
							.insert({
								organization_id: connection.organization_id,
								channel,
								page_id: pageId,
								sender_id: senderId,
								ref: safeRef,
								source: safeSource,
								type: event.referral.type,
								ad_id: event.referral.ad_id ?? null,
							});
						if (referralError) {
							capture(referralError, {
								context: "agent-gateway: facebook referral persistence",
							});
						}
						await handleMessage(supabase, {
							pageId,
							senderId,
							channel,
							text: `Хэрэглэгч ${safeRef} эх үүсвэрээс орлоо (${safeSource}) — тохирох эхлэл урсгалыг эхлүүл`,
							pageAccessToken,
							orgId: connection.organization_id,
							userId: connection.user_id ?? senderId,
							productType: connection.product_type as "tolom" | "zer",
							trace,
						});
					}
				} catch (error) {
					capture(error, {
						context: "agent-gateway: facebook referral starter flow",
					});
				}
			} else {
				const consentPayload =
					event.postback?.payload ?? event.message?.quick_reply?.payload;
				if (
					consentPayload === "subscribe" ||
					consentPayload === "unsubscribe"
				) {
					await captureConsent(
						supabase,
						connection.organization_id,
						channel,
						senderId,
						pageId,
						consentPayload === "subscribe",
						event.postback ? "postback" : "quick_reply",
					);
				}

				// quick reply ALSO carries message.text (the displayed label), so
				// these branches MUST be exclusive or the message is processed twice
				// (double agent call, double reply, double rate-limit/budget spend).
				if (
					consentPayload === "subscribe" ||
					consentPayload === "unsubscribe"
				) {
					// already handled consent — do not also process as postback/quick_reply
				} else if (event.postback?.payload) {
					await handlePostback(supabase, {
						pageId,
						senderId,
						channel,
						payload: event.postback.payload,
						pageAccessToken,
						orgId: connection.organization_id,
						userId: connection.user_id ?? senderId,
						productType: connection.product_type as "tolom" | "zer",
						trace,
					});
				} else if (event.message?.quick_reply?.payload) {
					// Handle quick reply payloads
					await handleQuickReply(
						supabase,
						{
							pageId,
							senderId,
							channel,
							payload: event.message.quick_reply.payload,
							pageAccessToken,
							orgId: connection.organization_id,
							userId: connection.user_id ?? senderId,
							productType: connection.product_type as "tolom" | "zer",
						},
						trace,
					);
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
						trace,
					});
				}
			}
			trace.flush();
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
			const feedTrace = createTraceLogger({
				traceId: `${rootTraceId}:feed:${entryId}`,
				organizationId: messengerConn.organization_id,
				channel: "messenger",
				channelChatId: entryId,
				requestText: "facebook feed change",
				requestId: rootTraceId,
				deploymentId,
			});
			const feedCtx = {
				pageId: entryId,
				pageAccessToken: decryptSecret(messengerConn.page_access_token ?? ""),
				orgId: messengerConn.organization_id,
				userId: messengerConn.user_id ?? entryId,
				productType: messengerConn.product_type as "tolom" | "zer" | "zatly",
				connectionId: messengerConn.id,
				trace: feedTrace,
			};
			for (const change of entry.changes) {
				if (change.field !== "feed") continue;
				const value = change.value;
				const feedKey =
					value.comment_id ??
					`${value.item}:${value.verb}:${value.post_id ?? ""}:${value.created_time ?? ""}`;
				if (await isDuplicateEvent(`feed:${entryId}:${feedKey}`)) continue;
				await handleFeedChange(supabase, feedCtx, change);
				feedTrace.log("info", "feed change handled", { feedKey });
			}
			feedTrace.flush();
		}
	}

	rootTrace.flush();
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
			{ text: "Сагс харах", callbackData: "cart_view" },
			{ text: "Дэмжлэг", callbackData: "support" },
		];
	}
	if (/^(сайн|hello|hi|hey|сайн уу)/i.test(text.trim())) {
		return [
			{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
			{ text: "Захиалга шалгах", callbackData: "order_status" },
			{ text: "Сагс харах", callbackData: "cart_view" },
		];
	}
	return [
		{ text: "Бүтээгдэхүүн үзэх", callbackData: "catalog" },
		{ text: "Сагс харах", callbackData: "cart_view" },
		{ text: "Захиалга шалгах", callbackData: "order_status" },
	];
}

/** Extract <qr>[{text,payload}]</qr> or trailing JSON quick replies from AI response. Returns {cleanText, aiReplies}. */
function extractAiQuickReplies(raw: string): {
	cleanText: string;
	aiReplies: Array<{ text: string; callbackData: string }>;
} {
	let jsonStr: string | null = null;
	let cleanText = raw;

	const m = raw.match(/<qr>([\s\S]*?)<\/qr>/i);
	if (m) {
		jsonStr = m[1].trim();
		cleanText = raw.replace(/<qr>[\s\S]*?<\/qr>/gi, "").trim();
	} else {
		// Fallback: match trailing JSON array without <qr> tags
		const mJson = raw.match(
			/\n*\s*(\[\s*\{[\s\S]*?"(?:payload|callbackData)"[\s\S]*\}\s*\])\s*$/i,
		);
		if (mJson) {
			jsonStr = mJson[1].trim();
			cleanText = raw.slice(0, mJson.index).trim();
		}
	}

	// Always clean any stray <qr> tags
	cleanText = cleanText.replace(/<\/?qr>/gi, "").trim();

	if (!jsonStr) return { cleanText, aiReplies: [] };

	try {
		const parsed = JSON.parse(jsonStr);
		if (!Array.isArray(parsed)) return { cleanText, aiReplies: [] };
		const aiReplies = parsed
			.slice(0, 5)
			.map((x: unknown) => {
				if (!x || typeof x !== "object") return null;
				const r = x as Record<string, unknown>;
				const text =
					typeof r.text === "string" ? r.text.trim().slice(0, 20) : "";
				const payload =
					typeof r.payload === "string"
						? r.payload.trim().slice(0, 1000)
						: typeof r.callbackData === "string"
							? r.callbackData.trim().slice(0, 1000)
							: "";
				if (!text || !payload) return null;
				return { text, callbackData: payload };
			})
			.filter((x): x is { text: string; callbackData: string } => x !== null);
		return { cleanText, aiReplies };
	} catch {
		return { cleanText, aiReplies: [] };
	}
}

function resolveQuickReplies(
	aiReplies: Array<{ text: string; callbackData: string }>,
	fallback: Array<{ text: string; callbackData: string }> | undefined,
): Array<{ text: string; callbackData: string }> | undefined {
	if (aiReplies.length > 0) return aiReplies.slice(0, 5);
	return fallback;
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
	trace?: TraceLogger;
}

/**
 * Handle incoming text message from Messenger/Instagram.
 */
async function handleMessage(
	supabase: ServiceClient,
	ctx: MessageContext,
	trace?: TraceLogger,
): Promise<void> {
	const channel = new FacebookChannel({
		pageId: ctx.pageId,
		pageAccessToken: ctx.pageAccessToken,
	});
	trace?.log("info", "handleMessage start", {
		channel: ctx.channel,
		textLen: ctx.text.length,
		productType: ctx.productType,
		text: ctx.text.slice(0, 200),
	});

	try {
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
			trace?.log("info", "flow handled", { flow: true });
			trace?.set({ responseText: flowResult, status: "ok" });
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
				trace?.set({ responseText: "Таны асуусан бараанууд:", status: "ok" });
				await channel.sendSenderAction(ctx.senderId, "typing_off");
				await channel.sendMessage(ctx.senderId, "Таны асуусан бараанууд:");
				await channel.sendProductCards(ctx.senderId, products);
				return;
			}
		}

		// No flow matched — fall through to AI agent handler
		// Capture searchProducts results so we can render them as horizontal cards on Messenger
		let capturedProducts: unknown = null;
		let capturedQpayImage: string | null = null;
		let capturedPaymentUrls: QpayBankUrl[] | null = null;
		let capturedPaymentLink: string | null = null;
		let capturedQrText: string | null = null;
		let capturedOrderId: string | null = null;
		const toolCalls: Array<Record<string, unknown>> = [];
		const response = await handleAgentMessage(gatewayCtx, ctx.text, "private", {
			getSystemPrompt: systemPromptFor,
			getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
			dataClient,
			onToolResult: (toolName, result) => {
				const hasProducts =
					result !== null &&
					typeof result === "object" &&
					"products" in result &&
					Array.isArray((result as { products: unknown }).products) &&
					(result as { products: unknown[] }).products.length > 0;
				toolCalls.push({
					name: toolName,
					hasProducts,
					result: hasProducts ? result : undefined,
				});
				trace?.log("info", "tool result", { toolName, hasProducts });
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
				// Capture QPay QR and payment info for direct send
				if (
					(toolName === "placeOrderWithQpay" ||
						toolName === "checkoutCartWithQpay") &&
					result !== null &&
					typeof result === "object"
				) {
					const rec = result as Record<string, unknown>;
					if (
						typeof rec.qpay_qr_image === "string" &&
						rec.qpay_qr_image.trim()
					) {
						capturedQpayImage = rec.qpay_qr_image.trim();
					}
					if (Array.isArray(rec.payment_urls)) {
						capturedPaymentUrls = rec.payment_urls as QpayBankUrl[];
					}
					if (typeof rec.payment_link === "string" && rec.payment_link.trim()) {
						capturedPaymentLink = rec.payment_link.trim();
					}
					if (typeof rec.qpay_qr_text === "string" && rec.qpay_qr_text.trim()) {
						capturedQrText = rec.qpay_qr_text.trim();
					}
					if (typeof rec.order_id === "string" && rec.order_id.trim()) {
						capturedOrderId = rec.order_id.trim();
					}
				}
			},
		});
		trace?.log("info", "LLM complete", {
			responseLen: response.length,
			preview: response.slice(0, 120),
			toolCalls: toolCalls.length,
			hasProducts:
				Array.isArray(capturedProducts) &&
				(capturedProducts as unknown[]).length > 0,
			hasPaymentLink: Boolean(capturedPaymentLink),
		});
		trace?.set({
			responseText: response,
			toolCalls,
		});
		// Hide typing indicator
		await channel.sendSenderAction(ctx.senderId, "typing_off");

		// AI-generated quick replies with deterministic fallback
		const { cleanText: aiCleanText, aiReplies } =
			extractAiQuickReplies(response);
		const responseText = aiCleanText || response.trim();

		// If the LLM called searchProducts on Messenger, render the result as
		// horizontally scrollable Generic Template cards instead of a plain text list.
		if (
			Array.isArray(capturedProducts) &&
			capturedProducts.length > 0 &&
			ctx.channel === "messenger"
		) {
			let intro = responseText.trim();
			// The Messenger prompt tells the model to give only a brief intro,
			// but guard against older prompts / long enumerated lists.
			const hasEnumeratedList =
				/\n\s*\d+\./.test(intro) || /\n\s*[-•]/.test(intro);
			if (hasEnumeratedList) {
				const firstLine = intro.split("\n")[0]?.trim() ?? "";
				intro = firstLine.length >= 10 ? firstLine : "Таны хайсан бараанууд:";
			}
			if (!intro) intro = "Таны хайсан бараанууд:";
			trace?.log("info", "sending intro + cards", {
				intro: intro.slice(0, 80),
				count: (capturedProducts as unknown[]).length,
			});
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
				return;
			}
			// Cards failed (e.g. Instagram, missing token, API error) — fall back to plain text
			trace?.log("warn", "cards failed, fallback to text", {
				responseLen: response.length,
			});
			await channel.sendMessage(ctx.senderId, responseText, {
				quickReplies: resolveQuickReplies(
					aiReplies,
					quickRepliesForCustomerMessage(ctx.text, ctx.channel),
				),
			});
			trace?.set({ responseText, status: "ok" });
			return;
		}

		// No products — normal text reply
		trace?.log("info", "sending text reply", {
			responseLen: responseText.length,
			preview: responseText.slice(0, 80),
		});
		trace?.set({ responseText, status: "ok" });

		// If QPay was returned, send QR image first!
		if (capturedQpayImage) {
			try {
				await channel.sendImage?.(ctx.senderId, capturedQpayImage);
			} catch {}
		}

		let quickReplies: Array<{ text: string; callbackData: string }> | undefined;
		if (capturedOrderId) {
			const bankReplies = buildQpayBankQuickReplies(
				capturedOrderId,
				capturedPaymentUrls,
				capturedQrText,
			);
			if (bankReplies.length > 0) {
				quickReplies = bankReplies;
			}
		}
		if (!quickReplies) {
			quickReplies = resolveQuickReplies(
				aiReplies,
				quickRepliesForCustomerMessage(ctx.text, ctx.channel),
			);
		}

		await channel.sendMessage(ctx.senderId, responseText, {
			quickReplies,
		});
	} catch (err) {
		trace?.error(err);
		trace?.set({
			status: "error",
			error: err instanceof Error ? err.message : String(err),
		});
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
	trace?: TraceLogger;
}

/**
 * Handle postback (button click) from Messenger.
 */
async function handlePostback(
	supabase: ServiceClient,
	ctx: PostbackContext,
	trace?: TraceLogger,
): Promise<void> {
	const channel = new FacebookChannel({
		pageId: ctx.pageId,
		pageAccessToken: ctx.pageAccessToken,
	});
	trace?.log("info", "handlePostback", {
		payload: ctx.payload.slice(0, 100),
		channel: ctx.channel,
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

			let bankReplies: Array<{ text: string; callbackData: string }> = [];
			if (
				result !== null &&
				typeof result === "object" &&
				"payment_method" in result &&
				(result as Record<string, unknown>).payment_method === "qpay"
			) {
				const record = result as Record<string, unknown>;
				const qrImage =
					typeof record.qpay_qr_image === "string"
						? record.qpay_qr_image.trim()
						: null;
				// Send QPay QR image first
				if (qrImage) {
					try {
						await channel.sendImage?.(ctx.senderId, qrImage);
					} catch {}
				}

				const orderId =
					typeof record.order_id === "string" ? record.order_id : "";
				const paymentUrls = Array.isArray(record.payment_urls)
					? (record.payment_urls as QpayBankUrl[])
					: [];
				const qrText =
					typeof record.qpay_qr_text === "string" ? record.qpay_qr_text : null;
				if (orderId) {
					bankReplies = buildQpayBankQuickReplies(orderId, paymentUrls, qrText);
				}
			}

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

			const quickReplies = bankReplies.length > 0 ? bankReplies : followUps;
			await channel.sendMessage(ctx.senderId, formatWriteResult(result), {
				quickReplies,
			});
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

	if (
		ctx.payload.startsWith("QPAY_BANK:") ||
		ctx.payload.startsWith("qpay_bank:")
	) {
		const parts = ctx.payload.split(":");
		const rawBankName = parts[1] ?? "";
		const orderId = parts[2]?.trim() ?? "";
		const bankName = rawBankName ? decodeURIComponent(rawBankName) : "Банк";

		if (orderId) {
			try {
				const { data: pending } = await supabase
					.from("qpay_pending")
					.select(
						"order_id, amount, payment_urls, payment_link, qr_text, qr_image",
					)
					.eq("order_id", orderId)
					.maybeSingle();

				const rawUrls = Array.isArray(pending?.payment_urls)
					? (pending.payment_urls as unknown as QpayBankUrl[])
					: [];
				const resolved = resolveBankDeeplink(
					bankName,
					rawUrls,
					pending?.qr_text,
				);
				const matchedName = resolved?.name || bankName;
				const deeplink = resolved?.link || "";
				const paymentLink = pending?.payment_link || rawUrls[0]?.link || "";

				const msg = formatBankPaymentMessage({
					bankName: matchedName,
					deeplink,
					paymentLink,
				});

				const followUps = buildQpayBankQuickReplies(
					orderId,
					rawUrls,
					pending?.qr_text,
				);
				await channel.sendMessage(ctx.senderId, msg, {
					quickReplies: followUps,
				});
			} catch (err) {
				capture(err, { context: "agent-gateway: QPAY_BANK postback" });
				await channel.sendMessage(
					ctx.senderId,
					"Төлбөрийн мэдээлэл авахад алдаа гарлаа.",
				);
			}
		}
		return;
	}

	if (
		ctx.payload.startsWith("QPAY_LINK:") ||
		ctx.payload.startsWith("qpay_link:")
	) {
		const orderId = ctx.payload
			.replace(/^qpay_link:/i, "")
			.replace(/^QPAY_LINK:/, "")
			.trim();
		if (orderId) {
			try {
				const { data: pending } = await supabase
					.from("qpay_pending")
					.select("order_id, payment_link, payment_urls, qr_text")
					.eq("order_id", orderId)
					.maybeSingle();

				const rawUrls = Array.isArray(pending?.payment_urls)
					? (pending.payment_urls as unknown as QpayBankUrl[])
					: [];
				const paymentLink = pending?.payment_link || rawUrls[0]?.link || "";

				const msg = paymentLink
					? `🔗 <b>QPay ерөнхий холбоос:</b>\n${paymentLink}\n\nДээрх холбоосоор орж дурын банкны аппаа сонгон төлбөрөө хийнэ үү.`
					: "QPay холбоос олдсонгүй. Манай ажилтан тантай холбогдоно.";

				const followUps = buildQpayBankQuickReplies(
					orderId,
					rawUrls,
					pending?.qr_text,
				);
				await channel.sendMessage(ctx.senderId, msg, {
					quickReplies: followUps,
				});
			} catch (err) {
				capture(err, { context: "agent-gateway: QPAY_LINK postback" });
				await channel.sendMessage(
					ctx.senderId,
					"QPay холбоос авахад алдаа гарлаа.",
				);
			}
		}
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
				await handleMessage(
					supabase,
					{
						...ctx,
						text: `${productName} худалдаж авах хүсэлтэй байна. 1 ширхэг. Захиалга үүсгэхэд туслаач.`,
					},
					trace,
				);
			} catch (err) {
				capture(err, { context: "agent-gateway: buy postback" });
				await handleMessage(
					supabase,
					{
						...ctx,
						text: `BUY:${productId} худалдаж авах`,
					},
					trace,
				);
			}
		}
		return;
	}
	if (ctx.payload === "catalog") {
		await handleMessage(supabase, { ...ctx, text: "жагсаалт" }, trace);
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
			await handleMessage(supabase, { ...ctx, text: "сагс үзэх" }, trace);
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
		await handleMessage(supabase, { ...ctx, text: "захиалах" }, trace);
		return;
	}
	if (
		cartPayload === "order_status" ||
		cartPayload === "order-status" ||
		cartPayload === "delivery" ||
		cartPayload === "help" ||
		cartPayload === "support" ||
		cartPayload === "тусламж"
	) {
		const mapped =
			cartPayload === "delivery"
				? "хүргэлт асуух"
				: cartPayload === "order_status" || cartPayload === "order-status"
					? "захиалга шалгах"
					: "тусламж";
		await handleMessage(supabase, { ...ctx, text: mapped }, trace);
		return;
	}
	await handleMessage(supabase, { ...ctx, text: ctx.payload }, trace);
}

interface QuickReplyContext {
	pageId: string;
	senderId: string;
	channel: "messenger" | "instagram";
	payload: string;
	pageAccessToken: string;
	orgId: string;
	userId: string;
	trace?: TraceLogger;
	productType: "tolom" | "zer";
}

/**
 * Handle quick reply payload from Messenger/Instagram.
 */
async function handleQuickReply(
	supabase: ServiceClient,
	ctx: QuickReplyContext,
	trace?: TraceLogger,
): Promise<void> {
	await handlePostback(supabase, ctx, trace);
}
