import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type { InvoiceWithItems } from "@/lib/types";

// ── SMTP Transport ─────────────────────────────────────────────

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return _transporter;
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM || "TOLOM <noreply@tolom.app>";
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Send an email via the configured SMTP transport.
 * Supports any SMTP provider — Gmail, SendGrid, Brevo, etc.
 * Change env vars to swap providers without code changes.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ id: string }> {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: from || getFromEmail(),
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  });
  return { id: info.messageId };
}

// ── Types ──────────────────────────────────────────────────────

export interface SendInvoiceEmailParams {
  invoice: InvoiceWithItems;
  orgName: string;
  recipientEmail: string;
  bccEmail?: string;
  publicInvoiceUrl: string;
}

// ── HTML Email Template ────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function renderInvoiceEmailHtml(
  invoice: InvoiceWithItems,
  orgName: string,
  publicInvoiceUrl: string,
): string {
  const items = invoice.items ?? [];
  const servicesTotal = items
    .filter((i) => i.item_type === "service")
    .reduce((sum, i) => sum + Number(i.total_price), 0);
  const partsTotal = items
    .filter((i) => i.item_type === "part")
    .reduce((sum, i) => sum + Number(i.total_price), 0);

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;background-color:${item.item_type === "service" ? "#eff6ff" : "#fffbeb"};color:${item.item_type === "service" ? "#2563eb" : "#d97706"};margin-right:8px;">${item.item_type === "service" ? "ҮҮ" : "СЭ"}</span>
            <span style="font-weight:500;">${item.description}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(Number(item.unit_price))}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(item.discount_amount) > 0 ? `-${formatCurrency(Number(item.discount_amount))}` : "\u2014"}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(Number(item.total_price))}</td>
        </tr>`,
    )
    .join("");

  const statusColor: Record<string, string> = {
    draft: "#6b7280",
    sent: "#2563eb",
    paid: "#16a34a",
    partial: "#d97706",
    overdue: "#dc2626",
    cancelled: "#6b7280",
  };

  const statusBg: Record<string, string> = {
    draft: "#f3f4f6",
    sent: "#eff6ff",
    paid: "#f0fdf4",
    partial: "#fffbeb",
    overdue: "#fef2f2",
    cancelled: "#f3f4f6",
  };

  const statusNames: Record<string, string> = {
    draft: "Ноорог",
    sent: "Илгээгдсэн",
    paid: "Төлөгдсөн",
    partial: "Хэсэгчилсэн",
    overdue: "Хугацаа хэтэрсэн",
    cancelled: "Цуцлагдсан",
  };

  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Нэхэмжлэх #${invoice.invoice_number}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:12px 12px 0 0;padding:32px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${orgName}</h1>
                    <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">Нэхэмжлэх #${invoice.invoice_number}</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background-color:${statusBg[invoice.status] ?? statusBg.draft};color:${statusColor[invoice.status] ?? statusColor.draft};">
                      ${statusNames[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top">
                    <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Төлбөр төлөгч</h3>
                    <table cellpadding="0" cellspacing="0">
                      ${invoice.customer_name ? `<tr><td style="font-size:14px;font-weight:500;color:#111827;padding-bottom:2px;">${invoice.customer_name}</td></tr>` : ""}
                      ${invoice.customer_phone ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.customer_phone}</td></tr>` : ""}
                      ${invoice.customer_email ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.customer_email}</td></tr>` : ""}
                      ${invoice.customer_address ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.customer_address}</td></tr>` : ""}
                    </table>
                  </td>
                  <td width="50%" valign="top">
                    <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Тээврийн хэрэгсэл</h3>
                    <table cellpadding="0" cellspacing="0">
                      ${invoice.vehicle_plate ? `<tr><td style="font-size:14px;font-family:monospace;font-weight:500;color:#111827;padding-bottom:2px;">${invoice.vehicle_plate}</td></tr>` : ""}
                      ${invoice.vehicle_details ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.vehicle_details}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:16px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;">Огноо: <span style="font-weight:500;color:#111827;">${formatDate(invoice.issued_at)}</span></td>
                  <td style="font-size:13px;color:#6b7280;text-align:right;">Төлөх хугацаа: <span style="font-weight:500;color:#111827;">${formatDate(invoice.due_at)}</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f9fafb;">
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:left;border-radius:6px 0 0 6px;">Бараа/Үйлчилгээ</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:center;">Тоо</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;">Үнэ</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;">Хямдрал</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;border-radius:0 6px 0 0;">Дүн</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length === 0 ? `<tr><td colspan="5" style="padding:24px;text-align:center;color:#9ca3af;">Мөр байхгүй</td></tr>` : itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="right">
                    <table cellpadding="0" cellspacing="0" style="min-width:220px;">
                      ${
                        servicesTotal > 0
                          ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Үйлчилгээний дүн</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#111827;text-align:right;">${formatCurrency(servicesTotal)}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        partsTotal > 0
                          ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Сэлбэгийн дүн</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#111827;text-align:right;">${formatCurrency(partsTotal)}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Нийт дүн</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#111827;text-align:right;">${formatCurrency(Number(invoice.subtotal))}</td>
                      </tr>
                      ${
                        Number(invoice.discount_total) > 0
                          ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Хямдрал</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#dc2626;text-align:right;">-${formatCurrency(Number(invoice.discount_total))}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding:8px 0 4px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:700;color:#111827;">Төлөх дүн</td>
                        <td style="padding:8px 0 4px 24px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:700;color:#111827;text-align:right;">${formatCurrency(Number(invoice.total))}</td>
                      </tr>
                      ${
                        Number(invoice.amount_paid) > 0
                          ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#16a34a;">Төлөгдсөн</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#16a34a;text-align:right;">-${formatCurrency(Number(invoice.amount_paid))}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;border-top:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;">Үлдэгдэл</td>
                        <td style="padding:4px 0 4px 24px;border-top:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;text-align:right;">${formatCurrency(Number(invoice.balance_due))}</td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${publicInvoiceUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;color:#ffffff;background-color:#111827;text-decoration:none;">
                      Нэхэмжлэх харах
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            invoice.notes
              ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 24px;">
              <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Тэмдэглэл</h3>
              <p style="margin:0;font-size:13px;color:#6b7280;white-space:pre-wrap;">${invoice.notes}</p>
            </td>
          </tr>`
              : ""
          }
          ${
            invoice.terms
              ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 24px;">
              <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Нөхцөл</h3>
              <p style="margin:0;font-size:13px;color:#6b7280;">${invoice.terms}</p>
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:24px 32px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                ${orgName} &middot; TOLOM систем
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Send an invoice email to a customer via the configured SMTP.
 * The email includes a link to the public invoice page and a summary.
 */
export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams,
): Promise<{ id: string }> {
  const { invoice, orgName, recipientEmail, bccEmail, publicInvoiceUrl } =
    params;

  const html = renderInvoiceEmailHtml(invoice, orgName, publicInvoiceUrl);

  const { id } = await sendEmail({
    from: `${orgName} <${getFromEmail()}>`,
    to: [recipientEmail],
    subject: `${orgName} — Нэхэмжлэх #${invoice.invoice_number}`,
    html,
  });

  return { id };
}

// ── Reminder Email ─────────────────────────────────────────────

export interface SendReminderEmailParams {
  recipientEmail: string;
  customerName: string;
  vehicleLabel: string;
  serviceName: string;
  orgName: string;
  dueDate: string;
}

function renderReminderEmailHtml(params: SendReminderEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Үйлчилгээний сануулга</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Үйлчилгээний хугацаа ойртлоо</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">${params.orgName}</p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;text-align:left;">
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Эрхэм <strong style="color:#111827;">${params.customerName}</strong> танд,</p>
                <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.5;">
                  Таны тээврийн хэрэгслийн дараах үйлчилгээний хугацаа ойртож байгааг сануулж байна:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Машин</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.vehicleLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Үйлчилгээ</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Хугацаа</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.dueDate}</td>
                  </tr>
                </table>
              </div>
              <p style="margin:0 0 0;font-size:13px;color:#9ca3af;">
                Цаг товлохыг хүсвэл бидэнтэй холбогдоно уу.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${params.orgName} &middot; TOLOM систем</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendReminderEmail(
  params: SendReminderEmailParams,
): Promise<{ id: string }> {
  const html = renderReminderEmailHtml(params);

  const { id } = await sendEmail({
    from: `${params.orgName} <${getFromEmail()}>`,
    to: [params.recipientEmail],
    subject: `Сануулга: ${params.serviceName} — ${params.vehicleLabel}`,
    html,
  });

  return { id };
}

/**
 * Test that SMTP is configured and the transporter can verify.
 */
export async function testEmailConfig(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
