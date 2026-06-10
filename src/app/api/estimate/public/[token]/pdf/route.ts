import { NextResponse } from "next/server";
import { EstimateDocument } from "@/lib/pdf/estimate-document";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { pdfFilename, renderToPdfBuffer } from "@/lib/utils/pdf";

/**
 * GET /api/estimate/public/[token]/pdf
 *
 * Public PDF endpoint — no auth required. Returns estimate PDF by public token.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createServiceRoleClient();

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select(
      `
      id, estimate_number, status, created_at, valid_until,
      notes, terms, subtotal, discount_amount, discount_percentage,
      discount_total, tax_total, grand_total,
      customer:customers(first_name, last_name, phone, email),
      vehicle:vehicles(plate_number, make, model, year),
      items:estimate_items(description, item_type, quantity, unit_price, discount_amount, discount_percentage, line_total),
      organization:organizations(name, phone, email, address)
    `,
    )
    .eq("public_token", token)
    .is("deleted_at", null)
    .single();

  if (error || !estimate) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Estimate not found" } },
      { status: 404 },
    );
  }

  const orgData = estimate.organization as {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;

  const buffer = await renderToPdfBuffer(
    EstimateDocument({
      estimate: {
        ...estimate,
        discount_amount: Number(estimate.discount_amount ?? 0),
        discount_percentage: Number(estimate.discount_percentage ?? 0),
        discount_total: Number(estimate.discount_total ?? 0),
        tax_total: Number(estimate.tax_total ?? 0),
        grand_total: Number(estimate.grand_total ?? 0),
        subtotal: Number(estimate.subtotal ?? 0),
        items: ((estimate.items ?? []) as Record<string, unknown>[]).map(
          (item) => ({
            ...item,
            unit_price: Number(item.unit_price),
            discount_amount: Number(item.discount_amount ?? 0),
            discount_percentage: Number(item.discount_percentage ?? 0),
            line_total: Number(item.line_total),
          }),
        ),
      },
      org: orgData ?? { name: "TOLOM" },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(estimate.estimate_number)}.pdf"`,
    },
  });
}
