import { NextResponse } from "next/server";

/**
 * Health check endpoint for uptime monitoring.
 * Returns basic status — no sensitive info exposed.
 */
export async function GET(): Promise<NextResponse> {
	return NextResponse.json({
		status: "ok",
		service: "agent-gateway",
		timestamp: new Date().toISOString(),
	});
}
