import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import {
  createInvoiceFromWorkOrder,
  createStandaloneInvoice,
  getInvoices,
} from "@/lib/services/invoice-service";
import type { InvoiceStatus } from "@/lib/types";
export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as InvoiceStatus) ?? undefined;
    const invoices = await getInvoices(supabase, orgId, { status });
    return ok(invoices);
  },
  { requiredPermission: { resource: "invoices", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();

    // Standalone invoice (no work order)
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const invoice = await createStandaloneInvoice(
        supabase,
        orgId,
        body,
        user.id,
      );
      return created(invoice);
    }

    // Work-order-based invoice
    if (!body.work_order_id) {
      throw new ValidationError(
        "work_order_id is required when no items provided",
      );
    }
    const invoice = await createInvoiceFromWorkOrder(
      supabase,
      orgId,
      body.work_order_id,
      {
        dueDays: body.due_days ?? body.dueDays,
        notes: body.notes,
        terms: body.terms,
        userId: user.id,
      },
    );
    return created(invoice);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "invoices", action: "create" },
  },
);
