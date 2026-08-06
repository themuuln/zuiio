import { NextResponse } from "next/server";

import { isGatewayApiKeyValid } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase";

/**
 * GET /api/facebook/connections?orgId=<uuid>
 *
 * Lists an org's active Messenger/Instagram page connections.
 * Server-to-server only (x-api-key) — used by product apps (zer/tolom/zatly)
 * to render connection status in their settings UI.
 *
 * Returns safe fields only — never the page access token.
 */
export async function GET(request: Request): Promise<NextResponse> {
	if (!isGatewayApiKeyValid(request)) {
		return NextResponse.json(
			{ error: "Unauthorized — valid x-api-key required" },
			{ status: 401 },
		);
	}

	const orgId = new URL(request.url).searchParams.get("orgId");
	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId query param is required" },
			{ status: 400 },
		);
	}

	const supabase = createServiceClient();
	const { data, error } = await supabase
		.from("channel_connections")
		.select(
			"channel, page_id, page_name, created_at, webhook_subscribed_at, token_expires_at",
		)
		.eq("organization_id", orgId)
		.in("channel", ["messenger", "instagram"])
		.eq("is_active", true)
		.order("created_at", { ascending: false });

	if (error) {
		return NextResponse.json(
			{ error: "Failed to fetch connections" },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		connections: (data ?? []).map((row) => ({
			channel: row.channel,
			pageId: row.page_id ?? "",
			pageName: row.page_name ?? null,
			connectedAt: row.created_at ?? null,
			webhookSubscribedAt: row.webhook_subscribed_at ?? null,
			tokenExpiresAt: row.token_expires_at ?? null,
		})),
	});
}
