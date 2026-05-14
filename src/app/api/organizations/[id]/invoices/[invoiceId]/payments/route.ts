import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { recordPayment } from "@/lib/services/invoice-service";

export const POST = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { invoiceId } = params;
  const body = await request.json();

  if (!body.amount || Number(body.amount) <= 0) {
    throw new ValidationError("A valid positive amount is required");
  }

  const payments = await recordPayment(invoiceId, orgId, {
    amount: Number(body.amount),
    method: body.method ?? "cash",
    reference: body.reference ?? undefined,
    notes: body.notes ?? undefined,
  });

  return NextResponse.json({ data: payments }, { status: 201 });
});
