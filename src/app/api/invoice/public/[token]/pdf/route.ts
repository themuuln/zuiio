/**
 * GET /api/invoice/public/[token]/pdf
 * Public invoice PDF download — no auth required.
 * Uses the get_public_invoice_by_token RPC (SECURITY DEFINER, anon allowed).
 */

import { NextResponse } from "next/server";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import { renderToPdfBuffer, pdfFilename } from "@/lib/utils/pdf";

export async function GET(
  _request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const { token } = await context.params;

  // Service role client bypasses RLS for public data
  const { createClient: createServiceClient } = await import(
    "@supabase/supabase-js"
  );
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch invoice via public RPC
  const { data: invoiceData, error: invError } = await supabase.rpc(
    "get_public_invoice_by_token",
    { p_token: token },
  );

  if (invError || !invoiceData) {
    return NextResponse.json(
      { error: { message: "Invoice not found" } },
      { status: 404 },
    );
  }

  // RPC returns a single object (not array)
  const invoice = Array.isArray(invoiceData) ? invoiceData[0] : invoiceData;

  if (!invoice) {
    return NextResponse.json(
      { error: { message: "Invoice not found" } },
      { status: 404 },
    );
  }

  // Fetch items + payments
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("invoice_items")
      .select(
        "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order",
      )
      .eq("invoice_id", invoice.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("invoice_payments")
      .select("id, invoice_id, amount, method, reference, notes, paid_at")
      .eq("invoice_id", invoice.id)
      .order("paid_at", { ascending: false }),
  ]);

  // Fetch org + branch for header
  const [{ data: org }, { data: branch }, { data: orgSettings }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("name, logo_url")
        .eq("id", invoice.organization_id)
        .single(),
      supabase
        .from("branches")
        .select("name, address, phone, email")
        .eq("organization_id", invoice.organization_id)
        .eq("is_main", true)
        .single(),
      supabase
        .from("organization_settings")
        .select("default_currency, default_tax_rate")
        .eq("organization_id", invoice.organization_id)
        .single(),
    ]);

  if (!org) {
    return NextResponse.json(
      { error: { message: "Organization not found" } },
      { status: 404 },
    );
  }

  const invoiceWithItems = {
    ...invoice,
    items: items ?? [],
    payments: payments ?? [],
  };

  const buffer = await renderToPdfBuffer(
    InvoiceDocument({
      invoice: invoiceWithItems as any,
      org: { name: org.name, logo_url: org.logo_url },
      branch,
      settings: orgSettings,
    }),
  );

  const filename = pdfFilename(`invoice-${invoice.invoice_number}`);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
