import crypto from "node:crypto";
import { capture } from "@zuiio/capture";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@zuiio/gateway-facebook";
import type { MetaMessagingEvent, MetaWebhookPayload } from "@zuiio/gateway-facebook";
import { handleFlowMessage } from "@/flow-executor";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { decryptSecret } from "@/lib/crypto";
import { formatWriteResult } from "@/lib/format-result";
import {
	createServiceClient,
	getSupabaseForProduct,
	type ServiceClient,
} from "@/lib/supabase";
import { confirmAction, rejectAction } from "@/runtime/confirmation";

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "";
const APP_SECRET = process.env.FB_APP_SECRET || "";

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

			// Replay guard — Meta redelivers until acked; skip events already
			// processed so retries never double-reply or re-spend LLM.
			const eventKey = eventDedupKey(channel, entryId, senderId, event);
			if (!(await claimEvent(supabase, channel, eventKey))) continue;

			// Dispatch the claimed event. Any unexpected error here — including
			// token decryption — must NOT strand the dedup claim: Meta's retry
			// would hit the unique constraint and the message would be lost
			// forever. Release the claim and fail this delivery (non-2xx) so
			// Meta redelivers.
			try {
				// Tokens are stored encrypted (encryptSecret) — decrypt once per event.
				const pageAccessToken = decryptSecret(
					connection.page_access_token ?? "",
				);

				// entryId is the correct Graph API recipient id for both channels:
				// FB page id for Messenger events, IG business account id for
				// Instagram. It also serves as the stable session-chat key per channel.
				const pageId = entryId;

				// A Meta messaging event carries exactly one of: postback
				// (button click), quick_reply payload, or plain text — but a
				// quick reply ALSO carries message.text (the displayed label),
				// so these branches MUST be exclusive or the message is
				// processed twice (double agent call, double reply, double
				// rate-limit/budget spend).

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
			} catch (err) {
				capture(err, { context: "agent-gateway: meta event dispatch" });
				const { error: releaseError } = await supabase
					.from("meta_webhook_events")
					.delete()
					.eq("channel", channel)
					.eq("event_id", eventKey);
				if (releaseError) {
					capture(releaseError, {
						context: "agent-gateway: release meta webhook claim",
					});
				}
				return NextResponse.json(
					{ error: "Event processing failed" },
					{ status: 500 },
				);
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

/**
 * Stable dedup key for one messaging event. Meta retries deliveries until
 * acked, so the same signed payload can arrive more than once. Prefer Meta's
 * message id; postbacks/quick replies carry none, so fall back to a
 * deterministic hash over the full event identity (channel + page + sender +
 * timestamp + which branch fired).
 */
function eventDedupKey(
	channel: "messenger" | "instagram",
	entryId: string,
	senderId: string,
	event: MetaMessagingEvent,
): string {
	const mid = event.message?.mid;
	if (mid) return mid;
	return crypto
		.createHash("sha256")
		.update(
			[
				channel,
				entryId,
				senderId,
				String(event.timestamp),
				event.postback?.payload ? "postback" : "message",
			].join(":"),
		)
		.digest("hex");
}

/**
 * Insert-first claim on meta_webhook_events. Returns true when this caller
 * owns the delivery; false on unique conflict (already-processed replay).
 * Any other insert error is captured and treated as unseen — fail-open, so a
 * transient DB error never silently drops a customer message.
 */
async function claimEvent(
	supabase: ServiceClient,
	channel: "messenger" | "instagram",
	eventKey: string,
): Promise<boolean> {
	const { error } = await supabase.from("meta_webhook_events").insert({
		channel,
		event_id: eventKey,
	});
	if (!error) return true;
	// Unique violation = already-processed replay.
	if (error.code === "23505") return false;
	// Any other DB error must not silently drop a customer message —
	// log it and process the event (worst case: one duplicate reply).
	capture(error, { context: "agent-gateway: webhook event dedup insert" });
	return true;
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
			externalOrganizationId: ctx.orgId,
			userId: ctx.userId,
			productType: ctx.productType,
			audience: "customer" as const,
			channel: ctx.channel,
			endpointId: ctx.pageId,
			conversationId: `legacy:${ctx.channel}:${ctx.pageId}:${ctx.senderId}`,
			channelChatId: ctx.pageId,
			channelUserId: ctx.senderId,
			traceId: crypto.randomUUID(),
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

		// No flow matched — fall through to AI agent handler
		const response = await handleAgentMessage(gatewayCtx, ctx.text, "private", {
			getSystemPrompt: systemPromptFor,
			getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
			dataClient,
		});

		// Hide typing indicator and send response
		await channel.sendSenderAction(ctx.senderId, "typing_off");
		await channel.sendMessage(ctx.senderId, response);
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

	// Handle confirmation postbacks via the shared confirmation store
	if (ctx.payload.startsWith("confirm:")) {
		const confirmId = ctx.payload.replace("confirm:", "");
		// Staged actions key on (channelChatId=pageId, channelUserId=sender).
		const staged = confirmAction(confirmId, ctx.pageId, ctx.senderId);
		if (!staged) {
			await channel.sendMessage(
				ctx.senderId,
				"Энэ үйлдлийн хугацаа дууссан эсвэл буруу байна.",
			);
			return;
		}
		// Re-execute the staged action deterministically — never via LLM re-prompt.
		if (staged.execute) {
			try {
				const result = await staged.execute(staged.args);
				await channel.sendMessage(ctx.senderId, formatWriteResult(result));
			} catch (err) {
				capture(err, {
					context: "agent-gateway: confirm staged action (meta)",
				});
				await channel.sendMessage(
					ctx.senderId,
					"Уучлаарай, үйлдлийг гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.",
				);
			}
		} else {
			await channel.sendMessage(ctx.senderId, "✅ Амжилттай.");
		}
		return;
	}

	if (ctx.payload.startsWith("reject:")) {
		const rejectId = ctx.payload.replace("reject:", "");
		rejectAction(rejectId);
		await channel.sendMessage(ctx.senderId, "❌ Цуцаллаа.");
		return;
	}

	// Default: treat as text message
	await handleMessage(supabase, {
		...ctx,
		text: ctx.payload,
	});
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
