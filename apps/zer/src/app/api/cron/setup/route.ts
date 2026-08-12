import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { connection, NextResponse } from "next/server";
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
  await connection();
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
    const appUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

    // G-EMAIL/G-ABANDONED: keep site_url fresh for DB-side pg_net hooks
    // (order confirmation trigger, cron routes). Object shape matches the
    // trigger's value->>'site_url' read.
    const { error: configError } = await (supabase as SupabaseClient)
      .from("app_config")
      .upsert(
        { key: "site_url", value: JSON.stringify({ site_url: appUrl }) },
        { onConflict: "key" },
      );
    if (configError)
      capture(configError, { context: "[cron/setup] app_config site_url" });

    const { data, error } = await supabase.rpc("schedule_daily_report_cron", {
      app_url: appUrl,
    });
    if (error)
      capture(error, { context: "[cron/setup] schedule_daily_report_cron" });

    const abandoned = await (supabase as SupabaseClient).rpc(
      "schedule_abandoned_cart_cron",
      {
        p_app_url: appUrl,
      },
    );
    if (abandoned.error)
      capture(abandoned.error, {
        context: "[cron/setup] schedule_abandoned_cart_cron",
      });

    return NextResponse.json({
      ok: true,
      message: data,
      abandonedCron: abandoned.data,
      note: "Cron jobs run every 30 minutes. To change schedule, update via Supabase SQL editor.",
    });
  } catch (err) {
    capture(err, { context: "cron/setup: GET" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/cron/setup - unschedule the cron job
 */
export async function DELETE(request: Request) {
  await connection();
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
    capture(err, { context: "cron/setup: DELETE" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
