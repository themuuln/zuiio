import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createGatewayControlClient } from "@/lib/gateway-control-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	if (!secret) return false;
	return (
		request.headers.get("authorization") === `Bearer ${secret}` ||
		request.headers.get("x-api-key") === secret
	);
}

async function deleteOlderThan(
	control: ReturnType<typeof createGatewayControlClient>,
	table: string,
	column: string,
	olderThanIso: string,
	eq?: Record<string, string>,
): Promise<number> {
	let query = control
		.from(table)
		.delete({ count: "exact" })
		.lt(column, olderThanIso);
	for (const [key, value] of Object.entries(eq ?? {})) {
		query = query.eq(key, value);
	}
	const { count, error } = await query;
	if (error) throw error;
	return count ?? 0;
}

/** Daily retention sweep. Dependency-safe order; child rows cascade. */
export async function POST(request: Request): Promise<NextResponse> {
	if (!isAuthorized(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const now = Date.now();
	const iso = (ms: number) => new Date(now - ms).toISOString();
	const day = 24 * 60 * 60 * 1_000;
	try {
		const control = createGatewayControlClient();
		const purged: Record<string, number> = {};
		purged.oauth_transactions_expired = await deleteOlderThan(
			control,
			"oauth_transactions",
			"expires_at",
			new Date(now).toISOString(),
			{ status: "expired" },
		);
		purged.oauth_transactions_terminal = await deleteOlderThan(
			control,
			"oauth_transactions",
			"updated_at",
			iso(day),
		);
		purged.service_nonces = await deleteOlderThan(
			control,
			"service_request_nonces",
			"expires_at",
			new Date(now).toISOString(),
		);
		purged.conversation_messages = await deleteOlderThan(
			control,
			"conversation_messages",
			"expires_at",
			new Date(now).toISOString(),
		);
		purged.inbound_payloads_completed = await deleteOlderThan(
			control,
			"inbound_events",
			"expires_at",
			new Date(now).toISOString(),
			{ status: "completed" },
		);
		purged.pending_actions_terminal = await deleteOlderThan(
			control,
			"pending_actions",
			"updated_at",
			iso(day),
		);
		purged.tool_audit_events = await deleteOlderThan(
			control,
			"tool_audit_events",
			"expires_at",
			new Date(now).toISOString(),
		);
		return NextResponse.json({ purged });
	} catch (err) {
		capture(err, { context: "agent-gateway: cleanup-control-plane" });
		return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
	}
}
