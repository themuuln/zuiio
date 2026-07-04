import { NextResponse } from "next/server";

/** Root health check endpoint. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "agent-gateway",
    timestamp: new Date().toISOString(),
  });
}
