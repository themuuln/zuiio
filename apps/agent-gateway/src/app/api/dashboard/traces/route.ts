import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * GET /api/dashboard/traces?orgId=<id>&channel=messenger&limit=50&status=ok
 * Lists recent gateway traces (service-role, RLS bypass).
 * Protected by dashboard middleware (DASHBOARD_SECRET).
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");
	const channel = url.searchParams.get("channel");
	const status = url.searchParams.get("status");
	const limitRaw = url.searchParams.get("limit");
	const traceId = url.searchParams.get("traceId");

	const limit = Math.min(Math.max(Number.parseInt(limitRaw ?? "50", 10) || 50, 1), 100);

	const sb = createServiceClient();
	let query = sb
		.from("gateway_traces")
		.select(
			"trace_id, organization_id, channel, channel_chat_id, channel_user_id, request_text, response_text, tool_calls, timings, status, error, request_id, deployment_id, created_at",
		)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (orgId) query = query.eq("organization_id", orgId);
	if (channel) query = query.eq("channel", channel);
	if (status) query = query.eq("status", status);
	if (traceId) query = query.eq("trace_id", traceId);

	const { data, error } = await query;

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ traces: data ?? [] });
}
