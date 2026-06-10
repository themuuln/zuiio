import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * GET /api/estimate/public/[token]
 *
 * Public endpoint — no auth required. Returns estimate data by public token.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createServiceRoleClient();

  // Fetch estimate by public_token (service role bypasses RLS)
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

  // Sort items by line_total descending as a proxy for sort_order
  const sortedItems = (estimate.items ?? []).sort(
    (a: { line_total: number }, b: { line_total: number }) =>
      Number(b.line_total) - Number(a.line_total),
  );

  return NextResponse.json({
    data: { ...estimate, items: sortedItems },
  });
}
