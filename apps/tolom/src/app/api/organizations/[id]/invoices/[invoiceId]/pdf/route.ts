/**
 * GET /api/organizations/[id]/invoices/[invoiceId]/pdf
 * Generates and returns an invoice as a PDF file.
 */

import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import { getInvoice } from "@/lib/services/invoice-service";
import { getOrganization } from "@/lib/services/organization-service";
import { pdfFilename, renderToPdfBuffer } from "@/lib/utils/pdf";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const invoiceId = params.invoiceId;

  // Fetch invoice with items and payments
  const invoice = await getInvoice(supabase, invoiceId);

  // Fetch org + main branch for PDF header
  const [org, { data: branch }, { data: orgSettings }] = await Promise.all([
    getOrganization(supabase, params.id),
    supabase
      .from("branches")
      .select("name, address, phone, email")
      .eq("organization_id", params.id)
      .eq("is_main", true)
      .single(),
    supabase
      .from("organization_settings")
      .select("default_currency, default_tax_rate")
      .eq("organization_id", params.id)
      .maybeSingle(),
  ]);

  // Render PDF
  const buffer = await renderToPdfBuffer(
    InvoiceDocument({
      invoice,
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
});
