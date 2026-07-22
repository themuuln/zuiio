import { createRouteHandler } from "@/lib/api-handler";
import { created } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import { recordPayment } from "@/lib/services/invoice-service";
export const POST = createRouteHandler(
  async ({ request, orgId, params, supabase, user }) => {
    const { invoiceId } = params;
    const body = await request.json();

    if (!body.amount || Number(body.amount) <= 0) {
      throw new ValidationError("A valid positive amount is required");
    }

    const payments = await recordPayment(supabase, invoiceId, orgId, {
      amount: Number(body.amount),
      method: body.method ?? "cash",
      reference: body.reference ?? undefined,
      notes: body.notes ?? undefined,
    }, user.id);

    return created(payments);
  },
  { rateLimit: true, subscription: true },
);
