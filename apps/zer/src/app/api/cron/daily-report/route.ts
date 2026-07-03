import { startOfDay, subDays } from "date-fns";
import { NextResponse } from "next/server";
import { generateEveningReport } from "@zuiio/ai-agent";
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
 *
 * Telegram messages use AI-generated prose via DeepSeek Flash.
 * Falls back to static template on failure or when DEEPSEEK_API_KEY
 * is not set.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  try {
    const supabase = createServiceClient();
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    const dateFrom = yesterday.toISOString();
    const dateTo = today.toISOString();

    // ─── Telegram Notifications ─────────────────────────────────────

    let telegramSent = 0;
    let telegramAIDone = 0;

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

        const report = await getFullReport(supabase, orgId, dateFrom, dateTo);

        // Build message: try AI first, fall back to static template
        let usedAi = false;
        let message =
          `*${orgName}* — Өдрийн тойм\n\n` +
          `📊 *Борлуулалт:* ${formatCurrency(report.financialSummary.totalSales)}\n` +
          `💵 *Орлого:* ${formatCurrency(report.financialSummary.totalPaid)}\n` +
          `📉 *Зарлага:* ${formatCurrency(report.financialSummary.totalExpenses)}\n` +
          `📦 *Борлуулсан бүтээгдэхүүн:* ${report.productSales.length}\n` +
          `⏳ *Хүлээгдэж буй:* ${report.pendingSales.length} борлуулалт\n` +
          `📋 *Хөдөлгөөн:* +${report.stockMovements.in} / -${report.stockMovements.out}`;

        if (deepseekKey) {
          try {
            const topProducts = [...report.productSales]
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((p) => ({
                name: p.productName,
                quantity: p.quantity,
                revenue: p.revenue,
              }));

            const lowStockItems: Array<{
              name: string;
              stock: number;
              threshold: number;
            }> = [];

            message = await generateEveningReport(
              {
                date: yesterday.toISOString().slice(0, 10),
                orgName,
                totalSales: report.financialSummary.totalSales,
                totalPaid: report.financialSummary.totalPaid,
                totalExpenses: report.financialSummary.totalExpenses,
                grossProfit: report.financialSummary.grossProfit,
                productSales: report.productSales.map((p) => ({
                  name: p.productName,
                  quantity: p.quantity,
                  revenue: p.revenue,
                  cost: p.cost,
                  profit: p.profit,
                  margin: p.margin,
                })),
                topProducts,
                expenseBreakdown: report.expenseBreakdown.map((e) => ({
                  category: e.category,
                  count: e.count,
                  total: e.total,
                })),
                stockMovements: {
                  in: report.stockMovements.in,
                  out: report.stockMovements.out,
                  adjustment: report.stockMovements.adjustment,
                },
                pendingSales: report.pendingSales.map((s) => ({
                  id: s.id,
                  contactName: s.contactName,
                  totalAmount: s.totalAmount,
                  paymentMethod: s.paymentMethod,
                })),
                commissionSummary: {
                  totalEarned: report.commissionSummary.totalEarned,
                  totalPaid: report.commissionSummary.totalPaid,
                  totalUnpaid: report.commissionSummary.totalUnpaid,
                },
                lowStockItems,
              },
              { apiKey: deepseekKey },
            );
            usedAi = true;
          } catch (aiErr) {
            console.error("AI report generation failed for org", orgId, aiErr);
          }
        }

        const result = await sendTelegramNotification(
          orgId,
          "daily_summary",
          `📋 Өдрийн тойм — ${orgName}`,
          message,
          supabase,
        );

        if (result.success) {
          telegramSent++;
          if (usedAi) telegramAIDone++;
        }
      }
    }

    // ─── Email Reports ──────────────────────────────────────────────

    let emailSent = 0;

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
      telegramAIDone,
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
