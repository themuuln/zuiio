import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/health
 *
 * Application-level health check. Verifies:
 * 1. Database connectivity (via Supabase admin client)
 * 2. Basic liveness
 *
 * Returns 200 if healthy, 503 if degraded.
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number }> =
    {};
  let healthy = true;

  // Database connectivity check
  const dbStart = Date.now();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("product_catalog").select("id").limit(1);

    checks.database = {
      status: error ? "error" : "ok",
      latencyMs: Date.now() - dbStart,
    };
    if (error) healthy = false;
  } catch {
    checks.database = { status: "error", latencyMs: Date.now() - dbStart };
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}
