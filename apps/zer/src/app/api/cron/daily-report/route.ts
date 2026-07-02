import { startOfDay, subDays } from "date-fns";
import { NextResponse } from "next/server";
import { sendDailyReportEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/format";
import { sendTelegramNotification } from "@/lib/notification";
import { getFullReport } from "@/lib/reports";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * Cron job endpoint called by pg_cron via net.http_post.
 * Sends daily summary Telegram notifications to all orgs that have
 * daily_summary event type enabled, AND sends daily report emails
 * to orgs with report_email_enabled = true.
 */
export async function POST(request: Request) {
  // Require CRON_SECRET Bearer token to prevent unauthorized invocation
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    const dateFrom = yesterday.toISOString();
    const dateTo = today.toISOString();

    // ─── Telegram Notifications ─────────────────────────────────────

    let telegramSent = 0;

    // Fetch all telegram notification configs with daily_summary enabled
    const { data: configs } = await supabase
      .from("notification_configs")
      .select("*, organizations!inner(name)")
      .eq("channel", "telegram")
      .eq("enabled", true);

    if (configs && configs.length > 0) {
      for (const config of configs) {
        const eventTypes = config.event_types as string[];
        if (
          !Array.isArray(eventTypes) ||
          !eventTypes.includes("daily_summary")
        ) {
          continue;
        }

        const orgId = config.organization_id;
        const orgName = (
          config as unknown as { organizations: { name: string } }
        ).organizations.name;

        // Get report data for this org
        const report = await getFullReport(supabase, orgId, dateFrom, dateTo);

        const message =
          `*${orgName}* — Өдрийн тойм\n\n` +
          `📊 *Борлуулалт:* ${formatCurrency(report.financialSummary.totalSales)}\n` +
          `💵 *Орлого:* ${formatCurrency(report.financialSummary.totalPaid)}\n` +
          `📉 *Зарлага:* ${formatCurrency(report.financialSummary.totalExpenses)}\n` +
          `📦 *Борлуулсан бүтээгдэхүүн:* ${report.productSales.length}\n` +
          `⏳ *Хүлээгдэж буй:* ${report.pendingSales.length} борлуулалт (${formatCurrency(report.financialSummary.netCash < 0 ? 0 : report.financialSummary.netCash)})\n` +
          `📋 *Хөдөлгөөн:* +${report.stockMovements.in} / -${report.stockMovements.out}`;

        const result = await sendTelegramNotification(
          orgId,
          "daily_summary",
          `📋 Өдрийн тойм — ${orgName}`,
          message,
          supabase,
        );

        if (result.success) telegramSent++;
      }
    }

    // ─── Email Reports ──────────────────────────────────────────────

    let emailSent = 0;

    // Fetch all orgs with report_email_enabled and a recipient configured
    const { data: emailOrgs } = await supabase
      .from("organizations")
      .select("id, name, report_email_recipient")
      .eq("report_email_enabled", true)
      .not("report_email_recipient", "is", null);

    if (emailOrgs && emailOrgs.length > 0) {
      for (const org of emailOrgs) {
        if (!org.report_email_recipient) continue;

        const result = await sendDailyReportEmail(
          supabase,
          org.id,
          org.name,
          org.report_email_recipient,
        );

        if (result.success) emailSent++;
      }
    }

    return NextResponse.json({
      ok: true,
      telegramSent,
      emailSent,
    });
  } catch (err) {
    console.error("Daily report cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
