import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * Public invoice endpoint — no auth required.
 * Returns invoice data by public_token.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();
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

    return NextResponse.json({
      data: invoice,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
