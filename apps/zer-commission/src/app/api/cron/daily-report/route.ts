import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/format";
import { getFullReport } from "@/lib/reports";
import { createServiceClient } from "@/lib/supabase/server-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Generates a simple HTML report table from report data.
 */
function buildReportHtml(
  orgName: string,
  date: string,
  report: Awaited<ReturnType<typeof getFullReport>>,
): string {
  const { financialSummary, productSales, expenseBreakdown, stockMovements } =
    report;

  const rows = productSales
    .map(
      (p) => `
    <tr>
      <td style="padding:6px 10px;border:1px solid #ddd">${p.productName}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${p.quantity}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${formatCurrency(p.revenue)}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${formatCurrency(p.profit)}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${p.margin.toFixed(1)}%</td>
    </tr>`,
    )
    .join("");

  const expenseRows = expenseBreakdown
    .map(
      (e) => `
    <tr>
      <td style="padding:6px 10px;border:1px solid #ddd">${e.category}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${e.count}</td>
      <td style="padding:6px 10px;border:1px solid #ddd;text-align:right">${formatCurrency(e.total)}</td>
    </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#333">Өдрийн тайлан — ${orgName}</h2>
  <p style="color:#666">${date}</p>

  <h3>Санхүүгийн хураангуй</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Нийт борлуулалт</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${formatCurrency(financialSummary.totalSales)}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Орлого</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${formatCurrency(financialSummary.totalPaid)}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Зарлага</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${formatCurrency(financialSummary.totalExpenses)}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Цэвэр мөнгөн урсгал</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${formatCurrency(financialSummary.netCash)}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Нийт ашиг</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${formatCurrency(financialSummary.grossProfit)}</td></tr>
  </table>

  <h3>Борлуулалтын дэлгэрэнгүй</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Бүтээгдэхүүн</th>
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:right">Тоо</th>
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:right">Орлого</th>
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:right">Ашиг</th>
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:right">Ашигт</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5" style="padding:6px 10px;border:1px solid #ddd;text-align:center;color:#999">Өдрийн борлуулалт байхгүй</td></tr>'}</tbody>
  </table>

  <h3>Зарлагын ангилал</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:left">Ангилал</th>
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:right">Тоо</th>
        <th style="padding:6px 10px;border:1px solid #ddd;text-align:right">Дүн</th>
      </tr>
    </thead>
    <tbody>${expenseRows || '<tr><td colspan="3" style="padding:6px 10px;border:1px solid #ddd;text-align:center;color:#999">Өдрийн зарлага байхгүй</td></tr>'}</tbody>
  </table>

  <h3>Агуулахын хөдөлгөөн</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Орсон</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${stockMovements.in}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Гарсан</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${stockMovements.out}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #ddd">Тохируулга</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:right;font-weight:bold">${stockMovements.adjustment}</td></tr>
  </table>

  <p style="color:#999;font-size:12px;margin-top:30px">
    Энэхүү тайланг автоматаар үүсгэсэн болно.<br>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://zer.app"}">zer.app</a>
  </p>
</body>
</html>`;
}

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM

    // Find orgs where report_email_enabled and report_email_time matches
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, slug, report_email_recipient")
      .eq("report_email_enabled", true)
      .eq("report_email_time", currentTime);

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        message: "No orgs to process at this time",
      });
    }

    const results: { org: string; ok: boolean; error?: string }[] = [];

    for (const org of orgs) {
      try {
        let recipientEmail: string | null = org.report_email_recipient;

        // If no custom recipient set, fall back to the owner's email
        if (!recipientEmail) {
          const { data: owner } = await supabase
            .from("profiles")
            .select("id")
            .eq("organization_id", org.id)
            .eq("role", "owner")
            .maybeSingle();

          if (!owner) {
            results.push({
              org: org.name,
              ok: false,
              error: "No owner found and no recipient set",
            });
            continue;
          }

          const { data: authUser } = await supabase.auth.admin.getUserById(
            owner.id,
          );
          recipientEmail = authUser?.user?.email ?? null;
        }

        if (!recipientEmail) {
          results.push({
            org: org.name,
            ok: false,
            error: "No recipient email available",
          });
          continue;
        }

        // Generate report for today
        const report = await getFullReport(supabase, org.id, today, today);

        // Build HTML email
        const html = buildReportHtml(org.name, today, report);

        // Send email
        const sent = await sendEmail({
          to: recipientEmail,
          subject: `Өдрийн тайлан — ${org.name} (${today})`,
          html,
        });

        if (!sent) {
          results.push({
            org: org.name,
            ok: false,
            error: "Email send failed",
          });
          continue;
        }

        // Log the delivery
        await supabase.from("report_email_log").insert({
          organization_id: org.id,
          report_date: today,
          recipient_email: recipientEmail,
          status: "sent",
        });

        results.push({ org: org.name, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ org: org.name, ok: false, error: message });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Daily report cron error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
