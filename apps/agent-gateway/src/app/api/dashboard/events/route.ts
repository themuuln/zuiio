import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createGatewayControlClient } from "@/lib/gateway-control-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = [
	"received",
	"processing",
	"ready_to_deliver",
	"completed",
	"retryable_failed",
	"dead_letter",
] as const;

function isAuthorized(request: Request): boolean {
	const expected = process.env.DASHBOARD_API_KEY;
	if (!expected) return false;
	return request.headers.get("x-api-key") === expected;
}

/** Safe event metadata for the operator dashboard. No payloads or tokens. */
export async function GET(request: Request): Promise<NextResponse> {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const params = new URL(request.url).searchParams;
	const statusParam = params.get("status");
	const status =
		statusParam && (ALLOWED_STATUSES as readonly string[]).includes(statusParam)
			? statusParam
			: null;
	const limitParam = Number(params.get("limit") ?? "20");
	const limit = Number.isSafeInteger(limitParam)
		? Math.min(Math.max(limitParam, 1), 100)
		: 20;

	try {
		let query = createGatewayControlClient()
			.from("inbound_events")
			.select(
				"id, provider_event_id, external_endpoint_id, status, attempt_count, duplicate_count, last_error_code, trace_id, received_at, completed_at",
			)
			.order("received_at", { ascending: false })
			.limit(limit);
		query = status ? query.eq("status", status) : query;
		const { data, error } = await query;
		if (error) throw error;
		return NextResponse.json({ events: data ?? [] });
	} catch (err) {
		capture(err, { context: "agent-gateway: dashboard events list" });
		return NextResponse.json(
			{ error: "Failed to list events" },
			{ status: 500 },
		);
	}
}
