import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";
import { EstimateDocument } from "@/lib/pdf/estimate-document";
import { pdfFilename, renderToPdfBuffer } from "@/lib/utils/pdf";

/**
 * GET /api/estimate/public/[token]/pdf
 *
 * Public PDF endpoint — requires auth. Returns estimate PDF by public token.
 */
export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const { token } = params;

    const { data: estimateData, error } = await supabase.rpc(
      "get_public_estimate_by_token",
      { p_token: token },
    );

    if (error || !estimateData) {
      return apiError("NOT_FOUND", "Estimate not found", 404);
    }

    // RPC returns jsonb — cast shape is verified against the known RPC schema
    const raw = estimateData as {
      estimate_number: string;
      status: string;
      created_at: string;
      valid_until: string | null;
      notes: string | null;
      terms: string | null;
      subtotal: number | null;
      discount_amount: number | null;
      discount_percentage: number | null;
      discount_total: number | null;
      tax_total: number | null;
      grand_total: number | null;
      customer: {
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
      } | null;
      vehicle: {
        plate_number: string | null;
        make: string | null;
        model: string | null;
        year: number | null;
      } | null;
      items: Array<{
        description: string;
        item_type: string;
        quantity: number;
        unit_price: number;
        discount_amount: number;
        discount_percentage: number;
        line_total: number;
      }>;
      organization: {
        name: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
      };
    };

    const orgData = raw.organization ?? { name: "TOLOM" };

    const buffer = await renderToPdfBuffer(
      EstimateDocument({
        estimate: {
          estimate_number: raw.estimate_number,
          status: raw.status,
          created_at: raw.created_at,
          valid_until: raw.valid_until ?? null,
          notes: raw.notes ?? null,
          terms: raw.terms ?? null,
          subtotal: Number(raw.subtotal ?? 0),
          discount_amount: Number(raw.discount_amount ?? 0),
          discount_percentage: Number(raw.discount_percentage ?? 0),
          discount_total: Number(raw.discount_total ?? 0),
          tax_total: Number(raw.tax_total ?? 0),
          grand_total: Number(raw.grand_total ?? 0),
          customer: raw.customer ?? null,
          vehicle: raw.vehicle ?? null,
          items: (raw.items ?? []).map((item) => ({
            description: String(item.description ?? ""),
            item_type: String(item.item_type ?? "custom"),
            quantity: Number(item.quantity ?? 0),
            unit_price: Number(item.unit_price),
            discount_amount: Number(item.discount_amount ?? 0),
            discount_percentage: Number(item.discount_percentage ?? 0),
            line_total: Number(item.line_total),
          })),
        },
        org: {
          name: orgData.name ?? "TOLOM",
          phone: orgData.phone ?? null,
          email: orgData.email ?? null,
          address: orgData.address ?? null,
        },
      }),
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename(raw.estimate_number)}.pdf"`,
      },
    });
  },
  { requireOrg: false },
);
