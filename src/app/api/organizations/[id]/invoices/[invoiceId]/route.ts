import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteInvoice,
  getInvoice,
  markInvoiceEmailed,
  recordPayment,
  updateInvoiceStatus,
} from "@/lib/services/invoice-service";

export const GET = createRouteHandler(async ({ params }) => {
  const { invoiceId } = params;
  const invoice = await getInvoice(invoiceId);
  return NextResponse.json({ data: invoice });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  const { invoiceId } = params;
  const body = await request.json();

  if (body.action === "mark_emailed") {
    const invoice = await markInvoiceEmailed(invoiceId, orgId);
    return NextResponse.json({ data: invoice });
  }

  if (body.status) {
    const invoice = await updateInvoiceStatus(invoiceId, orgId, body.status, body.notes);
    return NextResponse.json({ data: invoice });
  }

  if (body.action === "record_payment") {
    const payments = await recordPayment(invoiceId, orgId, {
      amount: body.amount,
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    });
    return NextResponse.json({ data: payments });
  }

  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "No valid action" } },
    { status: 400 },
  );
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  const { invoiceId } = params;
  await deleteInvoice(invoiceId, orgId);
  return NextResponse.json({ data: null });
});
