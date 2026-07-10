import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {
  getStoreCreditBalance,
  getStoreCreditBalanceByInvoice,
  getStoreCreditTransactions,
} from "@/lib/services/store-credit-service";
import { createClient } from "@/lib/supabase/server";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ request, orgId }) => {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");
    const invoiceId = searchParams.get("invoice_id");

    if (!customerId && !invoiceId) {
      return apiError(
        "BAD_REQUEST",
        "customer_id or invoice_id is required",
        400,
      );
    }

    if (invoiceId) {
      // Get balance by invoice (returns customer info too)
      const data = await getStoreCreditBalanceByInvoice(
        supabase,
        invoiceId,
        orgId,
      );
      return ok(data);
    }

    const balance = await getStoreCreditBalance(supabase, customerId!, orgId);

    // Also get recent transactions if requested
    const includeTransactions = searchParams.get("include") === "transactions";
    let transactions: Awaited<ReturnType<typeof getStoreCreditTransactions>> =
      [];
    if (includeTransactions) {
      transactions = await getStoreCreditTransactions(
        supabase,
        customerId!,
        orgId,
        { limit: 10 },
      );
    }

    return ok({ balance, transactions });
  },
  { requiredPermission: { resource: "customers", action: "read" } },
);
