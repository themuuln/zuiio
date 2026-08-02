import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";

import { handleAgentMessage } from "@/gateway/agent-handler";
import type { GatewayContext } from "@/gateway/types";
import { getProductTools, systemPromptFor } from "@/gateway/webhook-helpers";
import { sanitizeUserInput } from "@/lib/sanitize";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";
import { checkRateLimit } from "@/state/rate-limit";

export const dynamic = "force-dynamic";

/** Max messages per visitor per minute (sliding window, like gateway channels). */
const WEBCHAT_RATE_LIMIT = 20;

/** Long-running agent replies are better shown late than never — 30s cap. */
const AGENT_TIMEOUT_MS = 30_000;

const TIMEOUT_REPLY =
	"Уучлаарай, хариу бэлтгэхэд удаж байна. Түр хүлээгээд дахин асууна уу.";

const FALLBACK_REPLY =
	"Уучлаарай, алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";

interface WebchatMessageBody {
	widgetKey?: string;
	visitorId?: string;
	text?: string;
}

interface WidgetRow {
	id: string;
	organization_id: string;
	product_type: "tolom" | "zer";
}

/** Resolve an active widget by key. Service-role only — RLS is deny-all. */
async function findActiveWidget(
	sb: ServiceClient,
	widgetKey: string,
): Promise<WidgetRow | null> {
	const { data, error } = await sb
		.from("agent_webchat_widgets")
		.select("id, organization_id, product_type")
		.eq("widget_key", widgetKey)
		.eq("is_active", true)
		.maybeSingle();

	if (error) {
		capture(error, { context: "agent-gateway: webchat widget lookup" });
		return null;
	}
	return (data as WidgetRow | null) ?? null;
}

export async function POST(request: Request): Promise<NextResponse> {
	let body: WebchatMessageBody;
	try {
		body = (await request.json()) as WebchatMessageBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const widgetKey = body.widgetKey?.trim() ?? "";
	const visitorId = body.visitorId?.trim() ?? "";
	const text = body.text ?? "";

	if (!widgetKey || !visitorId || !text) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}

	// Per-visitor rate limit (20 msg/min), same sliding-window pattern as the
	// Telegram/WhatsApp channels.
	const rl = await checkRateLimit(`webchat:${visitorId}`, WEBCHAT_RATE_LIMIT);
	if (!rl.allowed) {
		return NextResponse.json(
			{ error: "Rate limited", retryAfterMs: rl.resetInMs },
			{ status: 429 },
		);
	}

	const sb = createServiceClient();
	const widget = await findActiveWidget(sb, widgetKey);
	if (!widget) {
		return NextResponse.json({ error: "Widget not found" }, { status: 404 });
	}

	const ctx: GatewayContext = {
		orgId: widget.organization_id,
		userId: visitorId,
		productType: widget.product_type,
		audience: "customer",
		channel: "webchat",
		channelChatId: visitorId,
		channelUserId: visitorId,
		chatId: 0,
		telegramUserId: 0,
	};

	// Timeout guard: the browser widget shows a polite fallback instead of
	// hanging on a slow provider. The in-flight pipeline is not cancellable —
	// Promise.race just stops waiting; late resolutions are ignored.
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		const reply = await Promise.race([
			handleAgentMessage(ctx, sanitizeUserInput(text), "private", {
				getSystemPrompt: systemPromptFor,
				getTools: (toolCtx) => getProductTools(widget.product_type, toolCtx),
			}),
			new Promise<string>((resolve) => {
				timer = setTimeout(() => resolve(TIMEOUT_REPLY), AGENT_TIMEOUT_MS);
			}),
		]);
		return NextResponse.json({ reply });
	} catch (err) {
		capture(err, { context: "agent-gateway: webchat message error" });
		return NextResponse.json({ reply: FALLBACK_REPLY });
	} finally {
		if (timer) clearTimeout(timer);
	}
}
