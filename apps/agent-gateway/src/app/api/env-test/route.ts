import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    OPENCODE_API_KEY: process.env.OPENCODE_API_KEY ? `set (len=${process.env.OPENCODE_API_KEY.length})` : "UNSET",
    OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL || "UNSET",
    OPENCODE_MODEL: process.env.OPENCODE_MODEL || "UNSET",
    DEBUG: process.env.DEBUG || "UNSET",
  });
}
