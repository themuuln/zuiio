import { startOfDay, subDays } from "date-fns";
import { NextResponse } from "next/server";
import { formatCurrency } from "@/lib/format";
import { sendTelegramNotification } from "@/lib/notification";
import { getFullReport } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Cron job endpoint called by pg_cron via net.http_post.
 * Sends daily summary Telegram notifications to all orgs that have
 * daily_summary event type enabled.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    const dateFrom = yesterday.toISOString();
    const dateTo = today.toISOString();

    // Fetch all telegram notification configs with daily_summary enabled
    const { data: configs } = await supabase
      .from("notification_configs")
      .select("*, organizations!inner(name)")
      .eq("channel", "telegram")
      .eq("enabled", true);

    if (!configs || configs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    let sentCount = 0;

    for (const config of configs) {
      const eventTypes = config.event_types as string[];
      if (!Array.isArray(eventTypes) || !eventTypes.includes("daily_summary")) {
        continue;
      }

      const orgId = config.organization_id;
      const orgName = (config as unknown as { organizations: { name: string } })
        .organizations.name;

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
      );

      if (result.success) sentCount++;
    }

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (err) {
    console.error("Daily report cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
