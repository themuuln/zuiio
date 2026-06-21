import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { formatCurrency } from "@/lib/format";
import {
  getFinancialSummary,
  getPendingSales,
  getProductSalesBreakdown,
  getStockMovementsSummary,
} from "@/lib/reports";
import type { Database } from "@/lib/supabase/types";
import { escapeHtml } from "@/lib/validation";

// ─── Types ─────────────────────────────────────────────────────────────

interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string | null;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  smtpConfig?: SmtpConfig;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

// ─── SMTP Config ───────────────────────────────────────────────────────

/**
 * Get the highest-priority active SMTP config for system-wide use.
 */
export async function getActiveSmtpConfig(
  supabase: SupabaseClient<Database>,
): Promise<{ data: SmtpConfig | null }> {
  const { data, error } = await supabase
    .from("smtp_configs")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: null };
  }

  return {
    data: {
      id: data.id,
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.password,
      from_email: data.from_email,
      from_name: data.from_name,
    },
  };
}

// ─── Transporter ───────────────────────────────────────────────────────

/**
 * Build a nodemailer transporter from an SMTP config.
 */
export function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
}

// ─── Send Email ────────────────────────────────────────────────────────

/**
 * Send an email using the configured SMTP.
 * Auto-selects the highest-priority active SMTP config if none is provided.
 */
export async function sendEmail(
  supabase: SupabaseClient<Database>,
  params: SendEmailParams,
): Promise<EmailResult> {
  const { to, subject, html, smtpConfig } = params;

  try {
    let config = smtpConfig;
    if (!config) {
      const result = await getActiveSmtpConfig(supabase);
      if (!result.data) {
        return { success: false, error: "Идэвхтэй SMTP тохиргоо олдсонгүй." };
      }
      config = result.data;
    }

    const transporter = createTransporter(config);

    await transporter.sendMail({
      from: config.from_name
        ? `"${config.from_name}" <${config.from_email}>`
        : config.from_email,
      to,
      subject,
      html,
    });

    // Increment daily count for the SMTP config
    await supabase.rpc("increment_smtp_count", {
      config_id: config.id,
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "И-мэйл илгээхэд алдаа гарлаа.";
    return { success: false, error: errorMessage };
  }
}

// ─── Daily Report HTML ────────────────────────────────────────────────

/**
 * Generate a beautiful daily report HTML email with inline CSS styles.
 */
export async function generateDailyReportHtml(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  orgName: string,
  dateFrom: string,
  dateTo: string,
): Promise<string> {
  const report = await getFinancialSummary(
    supabase,
    organizationId,
    dateFrom,
    dateTo,
  );
  const productSales = await getProductSalesBreakdown(
    supabase,
    organizationId,
    dateFrom,
    dateTo,
  );
  const stockMovements = await getStockMovementsSummary(
    supabase,
    organizationId,
    dateFrom,
    dateTo,
  );
  const pending = await getPendingSales(
    supabase,
    organizationId,
    dateFrom,
    dateTo,
  );

  const topProducts = productSales.slice(0, 10);

  // Build product sales table rows
  const productRows = topProducts
    .map(
      (p) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(p.productName)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(p.revenue)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${p.margin.toFixed(1)}%</td>
    </tr>`,
    )
    .join("");

  // Build pending sales rows
  const pendingRows = pending
    .slice(0, 5)
    .map(
      (s) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(s.contactName ?? "Бүртгэлгүй")}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${new Date(s.saleDate).toLocaleDateString("mn-MN")}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(s.totalAmount)}</td>
    </tr>`,
    )
    .join("");

  const netCash = report.netCash < 0 ? 0 : report.netCash;

  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background-color:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding:32px 24px 16px;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">${escapeHtml(orgName)}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe;">Өдрийн тайлан</p>
        <p style="margin:4px 0 0;font-size:13px;color:#93c5fd;">
          ${new Date(dateFrom).toLocaleDateString("mn-MN")} - ${new Date(dateTo).toLocaleDateString("mn-MN")}
        </p>
      </td>
    </tr>

    <!-- Financial Summary Cards -->
    <tr>
      <td style="padding:24px 24px 8px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr>
            <td style="width:33.33%;padding:4px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#166534;text-transform:uppercase;font-weight:600;">Борлуулалт</p>
                <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#15803d;">${formatCurrency(report.totalSales)}</p>
              </div>
            </td>
            <td style="width:33.33%;padding:4px;">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#991b1b;text-transform:uppercase;font-weight:600;">Зарлага</p>
                <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#b91c1c;">${formatCurrency(report.totalExpenses)}</p>
              </div>
            </td>
            <td style="width:33.33%;padding:4px;">
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#075985;text-transform:uppercase;font-weight:600;">Цэвэр мөнгө</p>
                <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#0369a1;">${formatCurrency(netCash)}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Product Sales Table -->
    ${
      topProducts.length > 0
        ? `
    <tr>
      <td style="padding:16px 24px 8px;">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1f2937;">📦 Борлуулсан бүтээгдэхүүн</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:left;border-bottom:2px solid #e5e7eb;">Бүтээгдэхүүн</th>
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:center;border-bottom:2px solid #e5e7eb;">Тоо</th>
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;border-bottom:2px solid #e5e7eb;">Орлого</th>
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;border-bottom:2px solid #e5e7eb;">Ашиг</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </td>
    </tr>`
        : ""
    }

    <!-- Stock Movements Summary -->
    <tr>
      <td style="padding:16px 24px 8px;">
        <h2 style="margin:0 0 8px;font-size:16px;font-weight:600;color:#1f2937;">📊 Барааны хөдөлгөөн</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr>
            <td style="padding:8px;background:#f0fdf4;border-radius:6px;text-align:center;width:33%;">
              <span style="font-size:13px;color:#166534;">Орсон: <strong>${stockMovements.in}</strong></span>
            </td>
            <td style="padding:8px;text-align:center;width:5%;"></td>
            <td style="padding:8px;background:#fef2f2;border-radius:6px;text-align:center;width:33%;">
              <span style="font-size:13px;color:#991b1b;">Гарсан: <strong>${stockMovements.out}</strong></span>
            </td>
            <td style="padding:8px;text-align:center;width:5%;"></td>
            <td style="padding:8px;background:#fefce8;border-radius:6px;text-align:center;width:33%;">
              <span style="font-size:13px;color:#854d0e;">Тохируулга: <strong>${stockMovements.adjustment}</strong></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pending Sales -->
    ${
      pending.length > 0
        ? `
    <tr>
      <td style="padding:16px 24px 8px;">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1f2937;">⏳ Хүлээгдэж буй борлуулалт</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:left;border-bottom:2px solid #e5e7eb;">Харилцагч</th>
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:left;border-bottom:2px solid #e5e7eb;">Огноо</th>
              <th style="padding:8px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;border-bottom:2px solid #e5e7eb;">Дүн</th>
            </tr>
          </thead>
          <tbody>
            ${pendingRows}
          </tbody>
        </table>
      </td>
    </tr>`
        : ""
    }

    <!-- Footer -->
    <tr>
      <td style="padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          <strong style="color:#6b7280;">Zer ERP</strong> — Өдрийн тайлан
        </p>
        <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">
          Энэхүү и-мэйлийг автоматаар илгээв.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Daily Report ────────────────────────────────────────────────

/**
 * Send a daily report email to an organization's configured recipient.
 */
export async function sendDailyReportEmail(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  orgName: string,
  recipientEmail: string,
): Promise<EmailResult> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateFrom = yesterday.toISOString();
  const dateTo = today.toISOString();

  try {
    const html = await generateDailyReportHtml(
      supabase,
      organizationId,
      orgName,
      dateFrom,
      dateTo,
    );

    const result = await sendEmail(supabase, {
      to: recipientEmail,
      subject: `Өдрийн тайлан — ${orgName} (${yesterday.toLocaleDateString("mn-MN")})`,
      html,
    });

    // Log the result
    if (result.success) {
      await logEmailResult(
        supabase,
        organizationId,
        recipientEmail,
        yesterday,
        "sent",
      );
    } else {
      await logEmailResult(
        supabase,
        organizationId,
        recipientEmail,
        yesterday,
        "failed",
        result.error,
      );
    }

    return result;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Тайлан илгээхэд алдаа гарлаа.";
    await logEmailResult(
      supabase,
      organizationId,
      recipientEmail,
      yesterday,
      "failed",
      errorMessage,
    );
    return { success: false, error: errorMessage };
  }
}

// ─── Log Email Result ─────────────────────────────────────────────────

/**
 * Log an email send result to the report_email_log table.
 */
export async function logEmailResult(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  recipientEmail: string,
  reportDate: Date,
  status: "pending" | "sent" | "failed",
  errorMessage?: string,
  smtpConfigId?: string,
): Promise<void> {
  const payload: Record<string, string | null | undefined> = {
    organization_id: organizationId,
    recipient_email: recipientEmail,
    report_date: reportDate.toISOString().split("T")[0],
    status,
  };

  if (errorMessage) {
    payload.error_message = errorMessage;
  }

  if (status === "sent") {
    payload.sent_at = new Date().toISOString();
  }

  if (smtpConfigId) {
    payload.smtp_config_id = smtpConfigId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("report_email_log").insert(payload as any);
}
