import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
/**
 * Public invoice endpoint — requires auth.
 * Returns invoice data by public_token.
 */
export const GET = createSimpleRouteHandler(async ({ request, supabase }) => {
  const token = request.nextUrl.pathname.split("/").pop() ?? "";
  const { data: invoice, error } = await supabase.rpc(
    "get_public_invoice_by_token",
    { p_token: token },
  );

  if (error) throw error;
  if (!invoice) {
    return NextResponse.json(
      { error: { message: "Invoice not found" } },
      { status: 404 },
    );
  }
  return ok(invoice);
});
