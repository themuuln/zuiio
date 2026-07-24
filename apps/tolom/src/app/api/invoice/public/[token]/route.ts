import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

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
    return apiError("NOT_FOUND", "Invoice not found", 404);
  }
  return ok(invoice);
});
