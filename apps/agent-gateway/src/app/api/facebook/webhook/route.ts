import { capture } from "@zuiio/capture";

import crypto from "crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import type { MetaWebhookPayload } from "@/channels/types";
import { handleAgentMessage } from "@/gateway/agent-handler";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { confirmAction, rejectAction } from "@/runtime/confirmation";
import { createServiceClient, type ServiceClient, getSupabaseForProduct } from "@/lib/supabase";

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
		const pageId = entry.id;

		// Look up org from page_id
		const { data: connection, error: lookupError } = await supabase
			.from("channel_connections")
			.select("*")
			.eq("page_id", pageId)
			.eq("is_active", true)
			.single();

		if (lookupError || !connection) {
			// Unknown page — skip silently
			continue;
		}

		// Process each messaging event
		const messagingEvents = entry.messaging ?? [];
		for (const event of messagingEvents) {
			// Skip echo messages (sent by the page itself)
			if (event.message?.is_echo) continue;

			const senderId = event.sender.id;
			const channel = connection.channel as "messenger" | "instagram";

			// Handle text messages
			if (event.message?.text) {
				await handleMessage(supabase, {
					pageId,
					senderId,
					channel,
					text: event.message.text,
					pageAccessToken: connection.page_access_token ?? "",
					orgId: connection.organization_id,
					userId: connection.user_id ?? senderId,
					productType: connection.product_type as "tolom" | "zer",
				});
			}

			// Handle postbacks (button clicks)
			if (event.postback?.payload) {
				await handlePostback(supabase, {
					pageId,
					senderId,
					channel,
					payload: event.postback.payload,
					pageAccessToken: connection.page_access_token ?? "",
					orgId: connection.organization_id,
					userId: connection.user_id ?? senderId,
					productType: connection.product_type as "tolom" | "zer",
				});
			}

			// Handle quick reply payloads
			if (event.message?.quick_reply?.payload) {
				await handleQuickReply(supabase, {
					pageId,
					senderId,
					channel,
					payload: event.message.quick_reply.payload,
					pageAccessToken: connection.page_access_token ?? "",
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
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
	} catch {
		return false;
	}
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
		// Check 24h messaging window
		const { data: connection } = await supabase
			.from("channel_connections")
			.select("last_user_message_at")
			.eq("page_id", ctx.pageId)
			.eq("channel_user_id", ctx.senderId)
			.single();

		if (connection?.last_user_message_at) {
			const hoursSinceLastMessage =
				(Date.now() - new Date(connection.last_user_message_at).getTime()) /
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
			ctx.productType === "tolom"
				? getSupabaseForProduct("tolom")
				: supabase;

		// Show typing indicator while processing
		await channel.sendSenderAction(ctx.senderId, "typing_on");

		// Process through agent pipeline with real tools and system prompt
		const response = await handleAgentMessage(
			{
				orgId: ctx.orgId,
				userId: ctx.userId,
				productType: ctx.productType,
				chatId: 0,
				telegramUserId: 0,
				channel: ctx.channel,
				channelChatId: ctx.pageId,
				channelUserId: ctx.senderId,
				pageId: ctx.pageId,
				pageAccessToken: ctx.pageAccessToken,
			},
			ctx.text,
			"private",
			{
				getSystemPrompt: systemPromptFor,
				getTools: (toolCtx) =>
					getProductTools(ctx.productType, toolCtx),
				dataClient,
			},
		);

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

	// Handle confirmation postbacks
	// Handle confirmation postbacks via the shared confirmation store
	if (ctx.payload.startsWith("confirm:")) {
		const confirmId = ctx.payload.replace("confirm:", "");
		const staged = confirmAction(confirmId, ctx.senderId, ctx.userId);
		if (!staged) {
			await channel.sendMessage(
				ctx.senderId,
				"Энэ үйлдлийн хугацаа дууссан эсвэл буруу байна.",
			);
			return;
		}
		// Execute the staged action via agent pipeline
		const response = await handleAgentMessage(
			{
				orgId: ctx.orgId,
				userId: ctx.userId,
				productType: ctx.productType,
				chatId: 0,
				telegramUserId: 0,
				channel: ctx.channel,
				channelChatId: ctx.pageId,
				channelUserId: ctx.senderId,
				pageId: ctx.pageId,
				pageAccessToken: ctx.pageAccessToken,
			},
			`Баталгаажуулсан үйлдэл: ${staged.toolName} — ${staged.summary}`,
			"private",
			{
				getSystemPrompt: systemPromptFor,
				getTools: (toolCtx) => getProductTools(ctx.productType, toolCtx),
			},
		);
		await channel.sendMessage(ctx.senderId, `✅ ${response}`);
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
