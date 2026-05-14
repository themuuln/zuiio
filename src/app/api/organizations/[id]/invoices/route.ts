import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import type { InvoiceStatus } from "@/lib/database.types";
import { ValidationError } from "@/lib/errors";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createInvoiceFromWorkOrder, getInvoices } from "@/lib/services/invoice-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as InvoiceStatus) ?? undefined;
  const invoices = await getInvoices(orgId, { status });
  return NextResponse.json({ data: invoices });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  if (!body.work_order_id) {
    throw new ValidationError("work_order_id is required");
  }
  const invoice = await createInvoiceFromWorkOrder(orgId, body.work_order_id, {
    dueDays: body.due_days ?? body.dueDays,
    notes: body.notes,
    terms: body.terms,
  });
  return NextResponse.json({ data: invoice }, { status: 201 });
});
