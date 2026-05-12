import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { getInvoiceByPublicToken } from "@/lib/services/invoice-service";

type RouteContext = { params: Promise<{ token: string }> };

/**
 * Public invoice endpoint — no auth required.
 * Returns invoice data by public_token.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const invoice = await getInvoiceByPublicToken(token);

    // Also fetch org name for display
    let organization_name = "INVOICE";
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", invoice.organization_id)
        .single();
      if (org?.name) organization_name = org.name;
    } catch {
      // ignore
    }

    return NextResponse.json({
      data: { ...invoice, organization_name },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
