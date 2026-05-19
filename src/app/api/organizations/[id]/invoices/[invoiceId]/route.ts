import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  addInvoiceItem,
  deleteInvoice,
  getInvoice,
  markInvoiceEmailed,
  recordPayment,
  removeInvoiceItem,
  sendInvoiceAndMarkEmailed,
  updateInvoiceItem,
  updateInvoiceStatus,
} from "@/lib/services/invoice-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params }) => {
  const { invoiceId } = params;
  const invoice = await getInvoice(invoiceId);
  return NextResponse.json({ data: invoice });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { invoiceId } = params;
  const body = await request.json();

  if (body.action === "send_email") {
    const result = await sendInvoiceAndMarkEmailed(invoiceId, orgId);
    return NextResponse.json({ data: result });
  }

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

  if (body.action === "add_item") {
    const item = await addInvoiceItem(invoiceId, orgId, body.item);
    return NextResponse.json({ data: item });
  }

  if (body.action === "update_item") {
    const item = await updateInvoiceItem(body.itemId, invoiceId, orgId, body.item);
    return NextResponse.json({ data: item });
  }

  if (body.action === "remove_item") {
    await removeInvoiceItem(body.itemId, invoiceId, orgId);
    return NextResponse.json({ data: null });
  }

  if (body.action === "set_tax") {
    const supabase = await createClient();
    const taxTotal = body.tax_total;
    if (taxTotal === undefined || taxTotal < 0) {
      throw new ValidationError("tax_total is required and must be >= 0");
    }

    const { data: current } = await supabase
      .from("invoices")
      .select("subtotal, total")
      .eq("id", invoiceId)
      .single();

    if (!current) throw new NotFoundError("Invoice not found");

    const newTotal = current.subtotal + taxTotal;

    const { data: updated } = await supabase
      .from("invoices")
      .update({ tax_total: taxTotal, total: newTotal })
      .eq("id", invoiceId)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    return NextResponse.json({ data: updated });
  }

  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "No valid action" } },
    { status: 400 },
  );
});

export const DELETE = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const { invoiceId } = params;
  await deleteInvoice(invoiceId, orgId);
  return NextResponse.json({ data: null });
});
