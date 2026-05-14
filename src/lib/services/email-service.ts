import { Resend } from "resend";
import type { InvoiceWithItems } from "@/lib/database.types";

// ── Resend client (lazy-init) ──────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM ?? "noreply@tolom.app";
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
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;background-color:${item.item_type === "service" ? "#eff6ff" : "#fffbeb"};color:${item.item_type === "service" ? "#2563eb" : "#d97706"};margin-right:8px;">${item.item_type === "service" ? "SVC" : "PRT"}</span>
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${invoice.invoice_number}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px 12px 0 0;padding:32px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">${orgName}</h1>
                    <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">Invoice #${invoice.invoice_number}</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background-color:${statusBg[invoice.status] ?? statusBg.draft};color:${statusColor[invoice.status] ?? statusColor.draft};">
                      ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top">
                    <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Bill To</h3>
                    <table cellpadding="0" cellspacing="0">
                      ${invoice.customer_name ? `<tr><td style="font-size:14px;font-weight:500;color:#111827;padding-bottom:2px;">${invoice.customer_name}</td></tr>` : ""}
                      ${invoice.customer_phone ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.customer_phone}</td></tr>` : ""}
                      ${invoice.customer_email ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.customer_email}</td></tr>` : ""}
                      ${invoice.customer_address ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.customer_address}</td></tr>` : ""}
                    </table>
                  </td>
                  <td width="50%" valign="top">
                    <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Vehicle</h3>
                    <table cellpadding="0" cellspacing="0">
                      ${invoice.vehicle_plate ? `<tr><td style="font-size:14px;font-family:monospace;font-weight:500;color:#111827;padding-bottom:2px;">${invoice.vehicle_plate}</td></tr>` : ""}
                      ${invoice.vehicle_details ? `<tr><td style="font-size:13px;color:#6b7280;">${invoice.vehicle_details}</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dates -->
          <tr>
            <td style="background-color:#ffffff;padding:16px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#6b7280;">Issued: <span style="font-weight:500;color:#111827;">${formatDate(invoice.issued_at)}</span></td>
                  <td style="font-size:13px;color:#6b7280;text-align:right;">Due: <span style="font-weight:500;color:#111827;">${formatDate(invoice.due_at)}</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background-color:#f9fafb;">
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:left;border-radius:6px 0 0 6px;">Item</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:center;">Qty</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;">Unit Price</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;">Discount</th>
                    <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6b7280;text-align:right;border-radius:0 6px 0 0;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length === 0 ? `<tr><td colspan="5" style="padding:24px;text-align:center;color:#9ca3af;">No line items</td></tr>` : itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="right">
                    <table cellpadding="0" cellspacing="0" style="min-width:220px;">
                      ${servicesTotal > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Services Total</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#111827;text-align:right;">${formatCurrency(servicesTotal)}</td>
                      </tr>` : ""}
                      ${partsTotal > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Parts Total</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#111827;text-align:right;">${formatCurrency(partsTotal)}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Subtotal</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#111827;text-align:right;">${formatCurrency(Number(invoice.subtotal))}</td>
                      </tr>
                      ${Number(invoice.discount_total) > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">Discount</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#dc2626;text-align:right;">-${formatCurrency(Number(invoice.discount_total))}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:8px 0 4px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:700;color:#111827;">Grand Total</td>
                        <td style="padding:8px 0 4px 24px;border-top:2px solid #e5e7eb;font-size:16px;font-weight:700;color:#111827;text-align:right;">${formatCurrency(Number(invoice.total))}</td>
                      </tr>
                      ${Number(invoice.amount_paid) > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#16a34a;">Amount Paid</td>
                        <td style="padding:4px 0 4px 24px;font-size:13px;font-weight:500;color:#16a34a;text-align:right;">-${formatCurrency(Number(invoice.amount_paid))}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;border-top:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;">Balance Due</td>
                        <td style="padding:4px 0 4px 24px;border-top:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;text-align:right;">${formatCurrency(Number(invoice.balance_due))}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${publicInvoiceUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;color:#ffffff;background-color:#111827;text-decoration:none;">
                      View Full Invoice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notes -->
          ${invoice.notes ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 24px;">
              <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Notes</h3>
              <p style="margin:0;font-size:13px;color:#6b7280;white-space:pre-wrap;">${invoice.notes}</p>
            </td>
          </tr>` : ""}

          <!-- Terms -->
          ${invoice.terms ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 32px 24px;">
              <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Terms</h3>
              <p style="margin:0;font-size:13px;color:#6b7280;">${invoice.terms}</p>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:24px 32px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                ${orgName} &middot; Powered by TOLOM
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
 * Send an invoice email to a customer using Resend.
 * The email includes a link to the public invoice page and a summary.
 */
export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams,
): Promise<{ id: string }> {
  const { invoice, orgName, recipientEmail, bccEmail, publicInvoiceUrl } =
    params;

  const resend = getResend();
  const fromEmail = getFromEmail();

  const html = renderInvoiceEmailHtml(invoice, orgName, publicInvoiceUrl);

  const { data, error } = await resend.emails.send({
    from: `${orgName} <${fromEmail}>`,
    to: [recipientEmail],
    bcc: bccEmail ? [bccEmail] : undefined,
    replyTo: bccEmail ? bccEmail : undefined,
    subject: `Invoice #${invoice.invoice_number} from ${orgName}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data?.id ?? "" };
}

export async function testEmailConfig(): Promise<boolean> {
  try {
    getResend();
    return true;
  } catch {
    return false;
  }
}
