import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * GET /api/cron/setup
 *
 * Call this once after deployment to enable pg_cron scheduling.
 * Requires CRON_SECRET as Bearer token.
 *
 * The pg_cron job runs every 30 minutes and hits
 * POST /api/cron/daily-report to process orgs.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("schedule_daily_report_cron", {
      app_url: siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`,
    });
    if (error)
      capture(error, { context: "[cron/setup] schedule_daily_report_cron" });

    return NextResponse.json({
      ok: true,
      message: data,
      note: "Cron job runs every 30 minutes. To change schedule, update via Supabase SQL editor.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/cron/setup - unschedule the cron job
 */
export async function DELETE(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("unschedule_daily_report_cron");
    if (error)
      capture(error, { context: "[cron/setup] unschedule_daily_report_cron" });

    return NextResponse.json({ ok: true, message: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
