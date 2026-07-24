/**
 * GET /api/invoice/public/[token]/pdf
 * Public invoice PDF download — requires auth.
 * Uses the get_public_invoice_by_token RPC (SECURITY DEFINER).
 */

import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { InvoiceWithItems } from "@/lib/types";
import { pdfFilename, renderToPdfBuffer } from "@/lib/utils/pdf";
export const GET = createRouteHandler(
  async ({ params }) => {
    const { token } = params;

    const supabase = await createServiceRoleClient();

    // Fetch invoice via public RPC
    const { data: invoiceData, error: invError } = await supabase.rpc(
      // biome-ignore lint/suspicious/noExplicitAny: RPC name not in generated types union but works at runtime with SECURITY DEFINER invariant
      "get_public_invoice_by_token" as any,
      { p_token: token },
    );

    if (invError || !invoiceData) {
      return apiError("NOT_FOUND", "Invoice not found", 404);
    }

    // RPC returns a single object (not array)
    const invoice = (
      Array.isArray(invoiceData) ? invoiceData[0] : invoiceData
    ) as
      | {
          id: string;
          organization_id: string;
          invoice_number: string;
          [key: string]: unknown;
        }
      | undefined;

    if (!invoice) {
      return apiError("NOT_FOUND", "Invoice not found", 404);
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
          .maybeSingle(),
      ]);

    if (!org) {
      return apiError("NOT_FOUND", "Organization not found", 404);
    }

    // Build typed invoice from service-role query results
    const invoiceWithItems = {
      ...invoice,
      items: items ?? [],
      payments: payments ?? [],
      refunds: [],
    } as unknown as InvoiceWithItems;

    const buffer = await renderToPdfBuffer(
      InvoiceDocument({
        invoice: invoiceWithItems,
        org: {
          name: org.name,
          logo_url: org.logo_url,
        },
        branch: branch
          ? {
              name: branch.name,
              address: branch.address,
              phone: branch.phone,
              email: branch.email,
            }
          : null,
        settings: orgSettings
          ? {
              default_currency: orgSettings.default_currency,
              default_tax_rate: orgSettings.default_tax_rate,
            }
          : null,
      }),
    );

    const filename = pdfFilename(`invoice-${invoice.invoice_number}`);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
  { requireOrg: false },
);
