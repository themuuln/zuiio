import { capture, withDbCapture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createClient();

  try {
    const { data: invoiceData, error: rpcError } = await withDbCapture(
      "public invoice PDF: RPC lookup",
      supabase.rpc("get_public_invoice", { p_token: token }),
    );

    if (rpcError || !invoiceData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const invoice = invoiceData as Record<string, unknown>;
    const items = (invoice.items ?? []) as Array<Record<string, unknown>>;

    const total = Number(invoice.total_amount ?? 0);
    const paid = Number(invoice.paid_amount ?? 0);
    const balance = total - paid;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Нэхэмжлэл #${invoice.invoice_number}</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; font-size: 12px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .header { margin-bottom: 16px; }
    .header p { margin: 2px 0; }
    .info { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 11px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 6px 4px; border-bottom: 1px solid #ddd; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    .totals { text-align: right; margin-top: 12px; }
    .totals div { padding: 2px 0; }
    .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
    .muted { color: #666; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Нэхэмжлэл #${invoice.invoice_number}</h1>
    <p class="muted">${invoice.organization_name}</p>
  </div>
  <div class="info">
    <div>
      <p><strong>Харилцагч:</strong> ${invoice.contact_name ?? "-"}</p>
      <p>${invoice.contact_phone ?? ""}</p>
    </div>
    <div style="text-align:right">
      <p><strong>Огноо:</strong> ${invoice.issue_date}</p>
      <p><strong>Төлөв:</strong> ${invoice.status}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Бараа</th><th>Тоо</th><th>Нэгж үнэ</th><th>Дүн</th></tr></thead>
    <tbody>
      ${items.map((item) => `<tr><td>${item.product_name ?? item.description}</td><td>${item.quantity}</td><td>${item.unit_price}</td><td>${item.total_price}</td></tr>`).join("")}
    </tbody>
  </table>
  <div class="totals">
    <div>Нийт: ${total}</div>
    <div>Төлсөн: ${paid}</div>
    ${balance > 0 ? `<div class="grand-total">Үлдэгдэл: ${balance}</div>` : ""}
  </div>
  ${invoice.notes ? `<p class="muted" style="margin-top:16px">Тэмдэглэл: ${invoice.notes}</p>` : ""}
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (err) {
    capture(err, { context: "public invoice PDF" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
