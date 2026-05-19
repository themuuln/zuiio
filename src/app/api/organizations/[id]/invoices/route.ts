import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import type { InvoiceStatus } from "@/lib/database.types";
import { ValidationError } from "@/lib/errors";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { createInvoiceFromWorkOrder, createStandaloneInvoice, getInvoices } from "@/lib/services/invoice-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as InvoiceStatus) ?? undefined;
  const invoices = await getInvoices(orgId, { status });
  return NextResponse.json({ data: invoices });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const body = await request.json();

  // Standalone invoice (no work order)
  if (body.items && Array.isArray(body.items) && body.items.length > 0) {
    const invoice = await createStandaloneInvoice(orgId, body, user.id);
    return NextResponse.json({ data: invoice }, { status: 201 });
  }

  // Work-order-based invoice
  if (!body.work_order_id) {
    throw new ValidationError("work_order_id is required when no items provided");
  }
  const invoice = await createInvoiceFromWorkOrder(orgId, body.work_order_id, {
    dueDays: body.due_days ?? body.dueDays,
    notes: body.notes,
    terms: body.terms,
  });
  return NextResponse.json({ data: invoice }, { status: 201 });
});
