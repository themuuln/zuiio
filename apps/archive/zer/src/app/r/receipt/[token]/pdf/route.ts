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
    const { data: receiptData, error: rpcError } = await withDbCapture(
      "public receipt PDF: RPC lookup",
      supabase.rpc("get_public_receipt", { p_token: token }),
    );

    if (rpcError || !receiptData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const receipt = receiptData as Record<string, unknown>;
    const seller = receipt.seller as Record<string, unknown> | null;
    const buyer = receipt.buyer as Record<string, unknown> | null;
    const branch = receipt.branch as Record<string, unknown> | null;
    const lines = (receipt.lines ?? []) as Array<Record<string, unknown>>;
    const totals = receipt.totals as Record<string, unknown> | null;
    const paymentSplits = (receipt.payment_splits ?? []) as Array<
      Record<string, unknown>
    >;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Баримт №${receipt.receipt_number ?? receipt.invoice_number}</title>
  <style>
    body { font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; font-size: 12px; }
    h1 { font-size: 16px; text-align: center; margin: 0 0 8px; }
    .info { margin-bottom: 8px; }
    .info p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { padding: 4px 0; border-bottom: 1px solid #eee; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    .total { font-weight: bold; border-top: 2px solid #000; padding-top: 4px; }
    .muted { color: #666; font-size: 11px; }
    .splits { margin-top: 8px; }
    .splits div { display: flex; justify-content: space-between; padding: 2px 0; }
  </style>
</head>
<body>
  <h1>Баримт №${receipt.receipt_number ?? receipt.invoice_number}</h1>
  <div class="info">
    <p>${branch?.name ?? receipt.organization_name}</p>
    <p class="muted">${receipt.issue_date}</p>
    ${seller?.name ? `<p class="muted">Борлуулагч: ${seller.name}</p>` : ""}
    ${buyer?.name ? `<p class="muted">Худалдан авагч: ${buyer.name}</p>` : ""}
  </div>
  <table>
    <thead><tr><th>Бараа</th><th>Тоо</th><th>Үнэ</th><th>Дүн</th></tr></thead>
    <tbody>
      ${lines.map((l) => `<tr><td>${l.product_name ?? l.description}</td><td>${l.quantity}</td><td>${l.unit_price}</td><td>${l.total_price}</td></tr>`).join("")}
    </tbody>
  </table>
  <div class="total">Нийт: ${receipt.total_amount}</div>
  ${totals?.discount ? `<div class="muted">Хөнгөлөлт: -${totals.discount}</div>` : ""}
  ${totals?.tax ? `<div class="muted">НӨАТ: ${totals.tax}</div>` : ""}
  ${paymentSplits.length > 0 ? `<div class="splits">${paymentSplits.map((s) => `<div><span>${s.method}</span><span>${s.amount}</span></div>`).join("")}</div>` : ""}
  ${receipt.ebarimt_id ? `<p class="muted">eBarimt: ${receipt.ebarimt_id}</p>` : ""}
  ${receipt.cashier_name ? `<p class="muted">Кассир: ${receipt.cashier_name}</p>` : ""}
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
    capture(err, { context: "public receipt PDF" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
