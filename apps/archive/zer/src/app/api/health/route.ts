import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Check database connectivity
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    checks.database = error ? `error: ${error.message}` : "ok";
    if (error) healthy = false;
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : "unknown"}`;
    healthy = false;
  }

  // Check required env vars
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;

  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  checks.env = missing.length === 0 ? "ok" : `missing: ${missing.join(", ")}`;
  if (missing.length > 0) healthy = false;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}
