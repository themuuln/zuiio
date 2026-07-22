import { z } from "zod";
import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { NotFoundError, ValidationError } from "@/lib/errors";
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

// ── Zod schemas for each PATCH action ────────────────────────
// Zod errors are caught in the route handler and re-thrown as
// ValidationError so the standard error handler returns 400.

function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new ValidationError("Invalid request body", details);
  }
  return result.data;
}

const uuid = z.string().uuid("v4");

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(200),
  item_type: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().min(0),
  discount_amount: z.number().min(0).optional(),
  sort_order: z.number().int().optional(),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  method: z.string().max(50).optional(),
  reference: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  notes: z.string().max(500).optional(),
});

const addItemSchema = z.object({
  item: invoiceItemSchema,
});

const updateItemSchema = z.object({
  itemId: uuid,
  item: invoiceItemSchema.partial(),
});

const removeItemSchema = z.object({
  itemId: uuid,
});

const setTaxSchema = z.object({
  tax_total: z.number().min(0, "Tax must be >= 0"),
});

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { invoiceId } = params;
  const invoice = await getInvoice(supabase, invoiceId);
  return ok(invoice);
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase, user }) => {
    const { invoiceId } = params;
    const body = await request.json();

    if (body.action === "send_email") {
      const result = await sendInvoiceAndMarkEmailed(
        supabase,
        invoiceId,
        orgId,
      );
      return ok(result);
    }

    if (body.action === "mark_emailed") {
      const invoice = await markInvoiceEmailed(supabase, invoiceId, orgId, user.id);
      return ok(invoice);
    }

    if (body.status) {
      const parsed = validate(updateStatusSchema, body);
      const invoice = await updateInvoiceStatus(
        supabase,
        invoiceId,
        orgId,
        parsed.status,
        parsed.notes,
        user.id,
      );
      return ok(invoice);
    }

    if (body.action === "record_payment") {
      const parsed = validate(recordPaymentSchema, body);
      const payments = await recordPayment(supabase, invoiceId, orgId, {
        amount: parsed.amount,
        method: parsed.method,
        reference: parsed.reference,
        notes: parsed.notes,
      }, user.id);
      return ok(payments);
    }

    if (body.action === "add_item") {
      const parsed = validate(addItemSchema, body);
      const item = await addInvoiceItem(
        supabase,
        invoiceId,
        orgId,
        parsed.item,
      );
      return ok(item);
    }

    if (body.action === "update_item") {
      const parsed = validate(updateItemSchema, body);
      const item = await updateInvoiceItem(
        supabase,
        parsed.itemId,
        invoiceId,
        orgId,
        parsed.item,
      );
      return ok(item);
    }

    if (body.action === "remove_item") {
      const parsed = validate(removeItemSchema, body);
      await removeInvoiceItem(supabase, parsed.itemId, invoiceId, orgId);
      return ok(null);
    }

    if (body.action === "set_tax") {
      const parsed = validate(setTaxSchema, body);

      const { data: current } = await supabase
        .from("invoices")
        .select("subtotal, total")
        .eq("id", invoiceId)
        .single();

      if (!current) throw new NotFoundError("Invoice not found");

      const newTotal = current.subtotal + parsed.tax_total;

      const { data: updated } = await supabase
        .from("invoices")
        .update({ tax_total: parsed.tax_total, total: newTotal })
        .eq("id", invoiceId)
        .eq("organization_id", orgId)
        .select(
          "id, organization_id, invoice_number, status, subtotal, discount_total, tax_total, total, amount_paid, balance_due, issued_at, due_at, paid_at, notes",
        )
        .single();

      return ok(updated);
    }

    return apiError("INVALID_REQUEST", "No valid action", 400);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ orgId, params, supabase, user }) => {
    const { invoiceId } = params;
    await deleteInvoice(supabase, invoiceId, orgId, user.id);
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
