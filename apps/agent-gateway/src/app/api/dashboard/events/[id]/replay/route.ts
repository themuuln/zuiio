import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createGatewayControlClient } from "@/lib/gateway-control-client";
import { enqueueMetaJob } from "@/lib/worker-enqueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
	const expected = process.env.DASHBOARD_API_KEY;
	if (!expected) return false;
	return request.headers.get("x-api-key") === expected;
}

/**
 * Replay never mutates the completed event; it enqueues a new trace so the
 * idempotent processor can run again.
 */
export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { id } = await context.params;
	if (!/^[0-9a-f-]{36}$/i.test(id)) {
		return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
	}
	try {
		const control = createGatewayControlClient();
		const { data: event, error } = await control
			.from("inbound_events")
			.select("id, trace_id")
			.eq("id", id)
			.maybeSingle();
		if (error || !event) {
			return NextResponse.json({ error: "Event not found" }, { status: 404 });
		}
		const traceId = crypto.randomUUID();
		await enqueueMetaJob({
			kind: "replay_inbound_event",
			eventId: id,
			traceId,
		});
		return NextResponse.json({ replayed: true, traceId }, { status: 202 });
	} catch (err) {
		capture(err, { context: "agent-gateway: dashboard event replay" });
		return NextResponse.json({ error: "Replay failed" }, { status: 500 });
	}
}
