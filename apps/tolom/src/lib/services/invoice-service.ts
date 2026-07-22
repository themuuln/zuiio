import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { sendInvoiceEmail } from "@/lib/services/email-service";
import {
  notifyInvoiceSent,
  notifyPaymentReceived,
} from "@/lib/services/push-triggers";
import { calculateTax, getOrgTaxSettings } from "@/lib/services/tax-service";
import type {
  Invoice,
  InvoiceItem,
  InvoicePayment,
  InvoiceRefund,
  InvoiceWithItems,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

const DUPLICATE_INVOICE_NUMBER_ERR = "unique_invoice_number_per_org";
const MAX_INVOICE_RETRIES = 3;

/**
 * Retries an insert when the unique_invoice_number_per_org constraint fires,
 * regenerating the invoice number and trying again. Wraps the common pattern
 * of "read latest number → increment → insert" which races under concurrency.
 */
async function retryInsertInvoice<T>(
  db: SupabaseClient,
  orgId: string,
  insertFn: (
    invoiceNumber: string,
  ) => Promise<{ data: T | null; error: unknown } | null>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_INVOICE_RETRIES; attempt++) {
    const invoiceNumber = await generateInvoiceNumber(db, orgId);
    const result = await insertFn(invoiceNumber);
    if (!result) throw new Error("Failed to create invoice");

    const { data, error } = result as {
      data: T | null;
      error: { message?: string } | null;
    };

    if (data) return data;

    // RLS failures and other errors bubble immediately
    if (!error?.message?.includes(DUPLICATE_INVOICE_NUMBER_ERR)) {
      throw new Error(error?.message ?? "Failed to create invoice");
    }

    // On the last attempt, let the error surface
    if (attempt === MAX_INVOICE_RETRIES) {
      throw new Error(
        `Invoice number collision after ${MAX_INVOICE_RETRIES} attempts. Please try again.`,
      );
    }

    // Otherwise loop — generateInvoiceNumber will now see the just-inserted row
  }

  throw new Error("Failed to create invoice");
}

const invoiceItemFieldMap: FieldMap<Partial<AddInvoiceItemParams>> = {
  columns: {
    description: "description",
    item_type: "item_type",
    quantity: "quantity",
    unit_price: "unit_price",
    discount_amount: "discount_amount",
    sort_order: "sort_order",
  },
  transforms: {
    description: trimField,
  },
};

// ── Generate the next invoice number for an org ───
export async function generateInvoiceNumber(
  db: SupabaseClient,
  orgId: string,
): Promise<string> {
  const supabase = db;

  // Get org settings for prefix
  const { data: settings } = await supabase
    .from("organization_settings")
    .select("invoice_prefix")
    .eq("organization_id", orgId)
    .maybeSingle();

  const prefix = (settings?.invoice_prefix ?? "INV").trim();

  // Get the highest number for this org
  const { data: lastInvoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (lastInvoice?.invoice_number) {
    const match = lastInvoice.invoice_number.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const year = new Date().getFullYear();
  const numStr = String(nextNum).padStart(5, "0");
  return `${prefix}-${year}-${numStr}`;
}

// ── Get invoices for an org ───────────────────────
export async function getInvoices(
  db: SupabaseClient,
  orgId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  },
): Promise<InvoiceWithItems[]> {
  const supabase = db;

  let query = supabase
    .from("invoices")
    .select(
      "id, organization_id, invoice_number, status, subtotal, total, amount_paid, balance_due, issued_at, due_at, customer_name, customer_phone, vehicle_plate, public_token, created_at, updated_at, deleted_at",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 20) - 1,
    );
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message ?? "Failed to fetch invoices");
  return (data ?? []) as unknown as unknown as InvoiceWithItems[];
}

// ── Get a single invoice by ID ────────────────────
export async function getInvoice(
  db: SupabaseClient,
  id: string,
): Promise<InvoiceWithItems> {
  const supabase = db;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, organization_id, branch_id, invoice_number, status, subtotal, discount_total, tax_total, total, amount_paid, balance_due, issued_at, due_at, customer_id, customer_name, customer_phone, customer_email, customer_address, vehicle_id, vehicle_plate, vehicle_details, work_order_id, notes, terms, footer, public_token, email_sent_at, paid_at, created_at, updated_at, created_by, updated_by, deleted_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !invoice) throw new NotFoundError("Invoice not found");

  const [
    { data: items, error: itemsErr },
    { data: payments, error: paymentsErr },
    { data: refunds, error: refundsErr },
  ] = await Promise.all([
    supabase
      .from("invoice_items")
      .select(
        "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order, created_at",
      )
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("invoice_payments")
      .select(
        "id, invoice_id, amount, method, reference, notes, paid_at, created_at, created_by",
      )
      .eq("invoice_id", id)
      .order("paid_at", { ascending: false }),
    supabase
      .from("invoice_refunds")
      .select(
        "id, invoice_id, organization_id, amount, method, status, reason, reference, notes, refunded_at, created_at, updated_at, created_by",
      )
      .eq("invoice_id", id)
      .order("refunded_at", { ascending: false }),
  ]);

  if (itemsErr) {
    reportServerError("Failed to fetch invoice items", itemsErr);
    throw new Error(`Failed to fetch invoice items: ${itemsErr.message}`);
  }
  if (paymentsErr) {
    reportServerError("Failed to fetch invoice payments", paymentsErr);
    throw new Error(`Failed to fetch invoice payments: ${paymentsErr.message}`);
  }
  if (refundsErr) {
    reportServerError("Failed to fetch invoice refunds", refundsErr);
    throw new Error(`Failed to fetch invoice refunds: ${refundsErr.message}`);
  }

  return {
    ...invoice,
    items: (items ?? []) as unknown as InvoiceItem[],
    payments: (payments ?? []) as unknown as InvoicePayment[],
    refunds: (refunds ?? []) as unknown as InvoiceRefund[],
  } as unknown as unknown as InvoiceWithItems;
}

// ── Get invoice by public token (no auth needed) ──
export async function getInvoiceByPublicToken(
  db: SupabaseClient,
  token: string,
): Promise<InvoiceWithItems> {
  const supabase = db;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "id, organization_id, branch_id, invoice_number, status, subtotal, discount_total, tax_total, total, amount_paid, balance_due, issued_at, due_at, customer_id, customer_name, customer_phone, customer_email, customer_address, vehicle_id, vehicle_plate, vehicle_details, work_order_id, notes, terms, footer, public_token, email_sent_at, paid_at, created_at, updated_at, created_by, updated_by, deleted_at",
    )
    .eq("public_token", token)
    .is("deleted_at", null)
    .single();

  if (error || !invoice) throw new NotFoundError("Invoice not found");

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("invoice_items")
      .select(
        "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order, created_at",
      )
      .eq("invoice_id", invoice.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("invoice_payments")
      .select(
        "id, invoice_id, amount, method, reference, notes, paid_at, created_at, created_by",
      )
      .eq("invoice_id", invoice.id)
      .order("paid_at", { ascending: false }),
  ]);

  return {
    ...invoice,
    items: (items ?? []) as unknown as InvoiceItem[],
    payments: (payments ?? []) as unknown as InvoicePayment[],
  } as unknown as unknown as InvoiceWithItems;
}

// ── Create invoice from a work order ──────────────
export async function createInvoiceFromWorkOrder(
  db: SupabaseClient,
  orgId: string,
  workOrderId: string,
  options?: {
    dueDays?: number;
    notes?: string;
    terms?: string;
    userId?: string;
  },
  userId_?: string,
): Promise<InvoiceWithItems> {
  const supabase = db;
  const userId =
    options?.userId ?? userId_ ?? (await supabase.auth.getUser()).data.user?.id;
  // Fetch work order with all dependencies
  const { data: wo } = await supabase
    .from("work_orders")
    .select(
      "id, organization_id, status, customer_id, vehicle_id, discount_amount, nuat_enabled",
    )
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .single()
  if (!wo) throw new NotFoundError("Work order not found");
  if (wo.status !== "Completed" && wo.status !== "Ready for Pickup") {
    throw new ValidationError(
      "Work order must be Completed or Ready for Pickup to invoice",
    );
  }

  // Check if invoice already exists for this work order
  const { data: existing } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("work_order_id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return getInvoice(db, existing.id);
  }

  // Fetch customer, vehicle, services, and parts in parallel
  const [
    { data: customer },
    { data: vehicle },
    { data: services },
    { data: parts },
  ] = await Promise.all([
    wo.customer_id
      ? supabase
          .from("customers")
          .select(
            "id, first_name, last_name, company_name, phone, email, address",
          )
          .eq("id", wo.customer_id)
          .single()
      : { data: null },
    wo.vehicle_id
      ? supabase
          .from("vehicles")
          .select("id, make, model, year, plate_number")
          .eq("id", wo.vehicle_id)
          .single()
      : { data: null },
    supabase
      .from("work_order_services")
      .select(
        "id, service_name, quantity, unit_price, discount_amount, final_price",
      )
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_order_parts")
      .select(
        "id, part_name, quantity, unit_price, discount_amount, final_price",
      )
      .eq("work_order_id", workOrderId),
  ]);

  // Calculate totals
  const svcTotal = (services ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const partsTotal = (parts ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const subtotal = svcTotal + partsTotal;
  const discountTotal =
    Number(wo.discount_amount ?? 0) +
    (services ?? []).reduce(
      (sum, s) => sum + Number(s.discount_amount ?? 0),
      0,
    ) +
    (parts ?? []).reduce((sum, p) => sum + Number(p.discount_amount ?? 0), 0);

  // Calculate НӨАТ (VAT) based on work order and org settings
  const orgSettings = await getOrgTaxSettings(supabase, orgId);
  const nuatEnabled = wo.nuat_enabled ?? false;
  const taxableAmount = Math.max(subtotal - discountTotal, 0);
  const taxTotal = calculateTax(
    taxableAmount,
    orgSettings.taxRate,
    nuatEnabled,
  );

  const total = Math.max(0, subtotal - discountTotal + taxTotal);

  // Customer name
  const customerName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.company_name ||
      customer.phone ||
      null
    : null;

  const vehicleDetails = vehicle
    ? [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ")
    : null;

  // Due date
  const dueDays = options?.dueDays ?? 7;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + dueDays);

  // Create invoice (retries on unique_invoice_number_per_org collision)
  let usedInvoiceNumber = "";
  const invoice = await retryInsertInvoice<{ id: string }>(
    db,
    orgId,
    async (invoiceNumber) => {
      usedInvoiceNumber = invoiceNumber;
      return supabase
        .from("invoices")
        .insert({
          organization_id: orgId,
          work_order_id: workOrderId,
          customer_id: wo.customer_id,
          vehicle_id: wo.vehicle_id,
          invoice_number: invoiceNumber,
          status: "draft",
          subtotal,
          discount_total: discountTotal,
          tax_total: taxTotal,
          total,
          amount_paid: 0,
          balance_due: total,
          issued_at: new Date().toISOString(),
          due_at: dueAt.toISOString(),
          customer_name: customerName,
          customer_phone: customer?.phone ?? null,
          customer_email: customer?.email ?? null,
          customer_address: customer?.address ?? null,
          vehicle_plate: vehicle?.plate_number ?? null,
          vehicle_details: vehicleDetails,
          notes: options?.notes ?? null,
          terms: options?.terms ?? "Payment due upon receipt.",
          created_by: userId,
          updated_by: userId,
        })
        .select("id")
        .single();
    },
  );

  logAuditAfter({
    supabase,
    action: "create",
    table_name: "invoices",
    record_id: invoice.id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    new_data: {
      invoice_number: usedInvoiceNumber,
      status: "draft",
      total,
      customer_id: wo.customer_id,
      vehicle_id: wo.vehicle_id,
    },
  });

  // Create invoice items from services
  const serviceItems = (services ?? []).map((s, i) => ({
    invoice_id: invoice.id,
    item_type: "service" as const,
    description: s.service_name,
    quantity: s.quantity,
    unit_price: Number(s.unit_price),
    discount_amount: Number(s.discount_amount ?? 0),
    total_price: Number(s.final_price),
    sort_order: i,
  }));

  // Create invoice items from parts
  const partItems = (parts ?? []).map((p, i) => ({
    invoice_id: invoice.id,
    item_type: "part" as const,
    description: p.part_name,
    quantity: p.quantity,
    unit_price: Number(p.unit_price),
    discount_amount: Number(p.discount_amount ?? 0),
    total_price: Number(p.final_price),
    sort_order: (services?.length ?? 0) + i,
  }));

  // Batch insert all items in a single query
  const allItems = [...serviceItems, ...partItems];
  if (allItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(allItems);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidateTag(cacheTags.invoices(orgId), "max");

  // Return directly instead of re-fetching — avoids extra queries + createClient
  return {
    id: invoice.id,
    organization_id: orgId,
    branch_id: null,
    invoice_number: usedInvoiceNumber,
    status: "draft",
    subtotal,
    discount_total: discountTotal,
    tax_total: taxTotal,
    total,
    amount_paid: 0,
    balance_due: total,
    issued_at: new Date().toISOString(),
    due_at: dueAt.toISOString(),
    customer_id: wo.customer_id,
    customer_name: customerName,
    customer_phone: customer?.phone ?? null,
    customer_email: customer?.email ?? null,
    customer_address: customer?.address ?? null,
    vehicle_id: wo.vehicle_id,
    vehicle_plate: vehicle?.plate_number ?? null,
    vehicle_details: vehicleDetails,
    work_order_id: workOrderId,
    notes: options?.notes ?? null,
    terms: options?.terms ?? "Payment due upon receipt.",
    footer: null,
    public_token: null,
    email_sent_at: null,
    paid_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: userId ?? null,
    updated_by: userId ?? null,
    deleted_at: null,
    items: allItems.map((item, i) => ({
      id: `pending-${i}`,
      ...item,
      created_at: new Date().toISOString(),
    })) as unknown as InvoiceItem[],
    payments: [],
  } as unknown as InvoiceWithItems;
}

// ── Standalone invoice (no work order) ──────────────

interface StandaloneInvoiceItem {
  description: string;
  item_type: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
}

interface CreateStandaloneInvoiceParams {
  customer_id?: string | null;
  vehicle_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  vehicle_plate?: string | null;
  vehicle_details?: string | null;
  items: StandaloneInvoiceItem[];
  notes?: string | null;
  terms?: string;
  dueDays?: number;
  tax_rate?: number;
  tax_total?: number;
}

/**
 * Creates an invoice without a work order — for ad-hoc/manual billing.
 */
export async function createStandaloneInvoice(
  db: SupabaseClient,
  orgId: string,
  params: CreateStandaloneInvoiceParams,
  userId?: string,
): Promise<InvoiceWithItems> {
  if (!params.items || params.items.length === 0) {
    throw new ValidationError("At least one invoice item is required");
  }

  const supabase = db;

  // Calculate totals from items
  let subtotal = 0;
  let totalDiscount = 0;
  const invoiceItems = params.items.map((item, i) => {
    const qty = item.quantity ?? 1;
    const unitPrice = item.unit_price ?? 0;
    const discount = item.discount_amount ?? 0;
    const totalPrice = qty * unitPrice - discount;
    subtotal += totalPrice;
    totalDiscount += discount;

    return {
      item_type: item.item_type || "service",
      description: item.description,
      quantity: qty,
      unit_price: unitPrice,
      discount_amount: discount,
      total_price: Math.max(0, totalPrice),
      sort_order: i,
    };
  });

  // Compute tax
  let computedTaxTotal: number;
  if (params.tax_total !== undefined) {
    computedTaxTotal = params.tax_total;
  } else if (params.tax_rate !== undefined) {
    computedTaxTotal = Math.round(subtotal * params.tax_rate * 100) / 100;
  } else {
    computedTaxTotal = 0;
  }

  const total = subtotal + computedTaxTotal;

  const dueDays = params.dueDays ?? 7;
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + dueDays);

  // Create invoice (retries on unique_invoice_number_per_org collision)
  const invoice = await retryInsertInvoice<{ id: string }>(
    db,
    orgId,
    async (invoiceNumber) =>
      supabase
        .from("invoices")
        .insert({
          organization_id: orgId,
          invoice_number: invoiceNumber,
          status: "draft",
          customer_id: params.customer_id || null,
          vehicle_id: params.vehicle_id || null,
          subtotal,
          discount_total: totalDiscount,
          tax_total: computedTaxTotal,
          total,
          amount_paid: 0,
          balance_due: total,
          issued_at: new Date().toISOString(),
          due_at: dueAt.toISOString(),
          customer_name: params.customer_name || null,
          customer_phone: params.customer_phone || null,
          customer_email: params.customer_email || null,
          customer_address: params.customer_address || null,
          vehicle_plate: params.vehicle_plate || null,
          vehicle_details: params.vehicle_details || null,
          notes: params.notes || null,
          terms: params.terms || "Payment due upon receipt.",
          created_by: userId,
          updated_by: userId,
        })
        .select("id")
        .single(),
  );

  // Insert line items
  const itemsWithInvoiceId = invoiceItems.map((item) => ({
    ...item,
    invoice_id: invoice.id,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemsWithInvoiceId);

  if (itemsError) {
    // Rollback: delete the orphaned invoice record
    await supabase.from("invoices").delete().eq("id", invoice.id);
    reportServerError(
      "Failed to create invoice items, rolled back invoice",
      itemsError,
    );
    throw new Error(itemsError.message);
  }

  revalidateTag(cacheTags.invoices(orgId), "max");
  return getInvoice(db, invoice.id);
}

// ── Update invoice status ─────────────────────────
export async function updateInvoiceStatus(
  db: SupabaseClient,
  id: string,
  orgId: string,
  status: string,
  _notes?: string,
  userId_?: string,
): Promise<Invoice> {
  const supabase = db;
  const userId = userId_ ?? (await supabase.auth.getUser()).data.user?.id;

  const { data: oldInvoice, error: oldInvoiceErr } = await supabase
    .from("invoices")
    .select("id, status, total, amount_paid, balance_due")
    .eq("id", id)
    .single();

  if (oldInvoiceErr || !oldInvoice) {
    reportServerError(
      "Failed to fetch invoice for status update",
      oldInvoiceErr,
    );
    throw new NotFoundError("Invoice not found");
  }

  const updateData: Record<string, unknown> = {
    status,
    updated_by: userId,
  };

  if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
    updateData.amount_paid = oldInvoice?.total ?? 0;
    updateData.balance_due = 0;
  }

  if (status === "sent") {
    updateData.issued_at = new Date().toISOString();
  }

  if (status === "cancelled") {
    // Check if invoice has refunds — prevent cancellation of refunded invoices
    const { data: refunds } = await supabase
      .from("invoice_refunds")
      .select("id")
      .eq("invoice_id", id)
      .eq("status", "completed")
      .limit(1);

    if (refunds && refunds.length > 0) {
      throw new ValidationError(
        "Cannot cancel an invoice that has completed refunds. Void the refunds first or issue a refund instead of cancelling.",
      );
    }

    updateData.amount_paid = 0;
    updateData.balance_due = 0;
    updateData.amount_refunded = 0;
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, invoice_number, status, subtotal, total, amount_paid, balance_due, issued_at, due_at, customer_name, customer_phone, vehicle_plate, public_token, paid_at, created_at, updated_at, deleted_at",
    )
    .single();

  if (error || !data) throw new NotFoundError("Invoice not found");

  logAuditAfter({
    supabase,
    action: "update",
    table_name: "invoices",
    record_id: id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    old_data: oldInvoice ?? undefined,
    new_data: { status, updated_by: userId },
  });

  revalidateTag(cacheTags.invoice(id), "max");

  // Fire-and-forget push notifications — don't block the response
  if (status === "sent") {
    const ownerRes = await supabase
      .from("organization_users")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("role", "owner")
      .limit(1)
      .single();
    if (ownerRes.data) {
      notifyInvoiceSent(supabase, {
        userId: ownerRes.data.user_id,
        invoiceNumber: data.invoice_number,
        total: data.total,
      }).catch(() => {});
    }
  }
  if (status === "paid") {
    const ownerRes = await supabase
      .from("organization_users")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("role", "owner")
      .limit(1)
      .single();
    if (ownerRes.data) {
      notifyPaymentReceived(supabase, {
        userId: ownerRes.data.user_id,
        amount: data.total,
        workOrderNumber: data.invoice_number,
      }).catch(() => {});
    }
  }
  revalidateTag(cacheTags.invoices(data.organization_id as string), "max");
  return data as unknown as Invoice;
}

// ── Mark invoice as emailed ───────────────────────
export async function markInvoiceEmailed(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId_?: string,
): Promise<Invoice> {
  const supabase = db;

  const { data, error } = await supabase
    .from("invoices")
    .update({
      email_sent_at: new Date().toISOString(),
      status: "sent",
      updated_by: userId_ ?? (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, invoice_number, status, subtotal, total, amount_paid, balance_due, issued_at, due_at, customer_name, customer_phone, vehicle_plate, public_token, paid_at, email_sent_at, created_at, updated_at, deleted_at",
    )
    .single();

  if (error || !data) throw new NotFoundError("Invoice not found");
  revalidateTag(cacheTags.invoice(id), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
  return data as unknown as Invoice;
}

export async function sendInvoiceAndMarkEmailed(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
): Promise<{ emailed: boolean }> {
  const supabase = db;

  const invoice = await getInvoice(db, invoiceId);

  if (!invoice.customer_email) {
    throw new ValidationError(
      "Invoice has no customer email address. Add an email to the customer first.",
    );
  }

  const [{ data: org }, { data: branch }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", orgId).single(),
    supabase
      .from("branches")
      .select("email")
      .eq("organization_id", orgId)
      .eq("is_main", true)
      .maybeSingle(),
  ]);

  const orgName = org?.name ?? "Your Mechanic Shop";
  const bccEmail = branch?.email ?? undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicInvoiceUrl = `${siteUrl}/invoice/${invoice.public_token}`;

  await sendInvoiceEmail({
    invoice,
    orgName,
    recipientEmail: invoice.customer_email,
    bccEmail,
    publicInvoiceUrl,
  });

  await markInvoiceEmailed(db, invoiceId, orgId);

  return { emailed: true };
}

// ── Record a payment against an invoice ───────────
export async function recordPayment(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
  payment: {
    amount: number;
    method?: string;
    reference?: string;
    notes?: string;
  },
  userId_?: string,
): Promise<InvoicePayment[]> {
  const supabase = db;
  const userId = userId_ ?? (await supabase.auth.getUser()).data.user?.id;

  // Get current invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, total, status, amount_paid, amount_refunded, balance_due",
    )
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .single();

  if (!invoice) throw new NotFoundError("Invoice not found");

  // Find current open cash register session (for cash payments)
  const method = payment.method ?? "cash";
  let sessionId: string | null = null;
  if (method === "cash") {
    const today = new Date().toISOString().split("T")[0];
    const { data: session } = await supabase
      .from("cash_register_sessions")
      .select("id")
      .eq("organization_id", orgId)
      .eq("date", today)
      .eq("status", "open")
      .is("deleted_at", null)
      .maybeSingle();
    sessionId = session?.id ?? null;
  }

  // Record payment
  const { error } = await supabase.from("invoice_payments").insert({
    invoice_id: invoiceId,
    amount: payment.amount,
    method,
    reference: payment.reference ?? null,
    notes: payment.notes ?? null,
    cash_register_session_id: sessionId,
    created_by: userId,
  });

  if (error) throw new Error(error.message ?? "Failed to record payment");

  const { data: newPayment } = await supabase
    .from("invoice_payments")
    .select(
      "id, invoice_id, amount, method, reference, notes, paid_at, created_at, created_by",
    )
    .eq("invoice_id", invoiceId)
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  logAuditAfter({
    supabase,
    action: "create",
    table_name: "invoice_payments",
    record_id: newPayment?.id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    new_data: newPayment ?? {
      invoice_id: invoiceId,
      amount: payment.amount,
      method: payment.method ?? "cash",
      reference: payment.reference ?? null,
      notes: payment.notes ?? null,
    },
  });

  // Create cash register entry for cash payments linked to a session
  if (sessionId && method === "cash") {
    await supabase.from("cash_register_entries").insert({
      session_id: sessionId,
      organization_id: orgId,
      entry_type: "in",
      amount: payment.amount,
      source: "invoice_payment",
      source_id: invoiceId,
      description: `Invoice ${invoice.invoice_number ?? invoiceId}`,
      created_by: userId,
    });
  }

  // Update invoice totals
  const { data: allPayments } = await supabase
    .from("invoice_payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const totalPaid = (allPayments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );
  const balanceDue = Math.max(0, Number(invoice.total) - totalPaid);

  // Status logic: account for refunds
  // If fully refunded, status stays "refunded"
  // If balance due is 0, status is "paid"
  // If partial payment, status is "partial"
  // Otherwise keep current status
  let newStatus = invoice.status;
  if (invoice.status === "refunded") {
    // Keep refunded status even after new payment
    newStatus = "refunded";
  } else if (balanceDue <= 0) {
    newStatus = "paid";
  } else if (totalPaid > 0) {
    newStatus = "partial";
  }

  await supabase
    .from("invoices")
    .update({
      amount_paid: totalPaid,
      balance_due: balanceDue,
      status: newStatus,
      paid_at: balanceDue <= 0 ? new Date().toISOString() : null,
      updated_by: userId,
    })
    .eq("id", invoiceId);

  revalidateTag(cacheTags.invoice(invoiceId), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");

  // Return updated payments
  const { data: updatedPayments } = await supabase
    .from("invoice_payments")
    .select(
      "id, invoice_id, amount, method, reference, notes, paid_at, created_at, created_by",
    )
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });

  return (updatedPayments ?? []) as unknown as unknown as InvoicePayment[];
}

// ── Get invoice count by status ───────────────────
export async function getInvoiceStats(
  db: SupabaseClient,
  orgId: string,
): Promise<{
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  outstanding: number;
}> {
  const supabase = db;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("status, total, balance_due")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  const all = invoices ?? [];

  return {
    total: all.length,
    draft: all.filter((i) => i.status === "draft").length,
    sent: all.filter((i) => i.status === "sent").length,
    paid: all.filter((i) => i.status === "paid").length,
    overdue: all.filter((i) => i.status === "overdue").length,
    totalRevenue: all
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.total), 0),
    outstanding: all
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce((sum, i) => sum + Number(i.balance_due), 0),
  };
}

// ── Invoice Item CRUD ─────────────────────────────

interface AddInvoiceItemParams {
  description: string;
  item_type: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  sort_order?: number;
}

/**
 * Adds a new line item to an existing invoice.
 * Recalculates invoice totals after adding.
 */
export async function addInvoiceItem(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
  params: AddInvoiceItemParams,
): Promise<InvoiceItem> {
  if (!params.description?.trim()) {
    throw new ValidationError("Item description is required");
  }

  const supabase = db;

  const quantity = params.quantity ?? 1;
  const unitPrice = params.unit_price ?? 0;
  const discount = params.discount_amount ?? 0;
  const totalPrice = quantity * unitPrice - discount;

  const { data, error } = await supabase
    .from("invoice_items")
    .insert({
      invoice_id: invoiceId,
      description: params.description.trim(),
      item_type: params.item_type || "service",
      quantity,
      unit_price: unitPrice,
      discount_amount: discount,
      total_price: Math.max(0, totalPrice),
      sort_order: params.sort_order ?? 0,
    })
    .select(
      "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add invoice item");
  }

  // Recalculate invoice totals
  await recalculateInvoiceTotals(db, invoiceId, orgId);

  revalidateTag(cacheTags.invoice(invoiceId), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");

  return data as unknown as unknown as InvoiceItem;
}

/**
 * Updates an existing invoice line item.
 * Recalculates invoice totals after updating.
 */
export async function updateInvoiceItem(
  db: SupabaseClient,
  itemId: string,
  invoiceId: string,
  orgId: string,
  params: Partial<AddInvoiceItemParams>,
): Promise<InvoiceItem> {
  const supabase = db;

  if (params.description !== undefined && !params.description.trim()) {
    throw new ValidationError("Item description cannot be empty");
  }

  const updates = buildUpdates(params, invoiceItemFieldMap);

  if (Object.keys(updates).length === 0) {
    throw new ValidationError("No fields to update");
  }

  // If quantity, unit_price, or discount changed, recalculate total_price
  if (
    params.quantity !== undefined ||
    params.unit_price !== undefined ||
    params.discount_amount !== undefined
  ) {
    const { data: current } = await supabase
      .from("invoice_items")
      .select(
        "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order, created_at",
      )
      .eq("id", itemId)
      .single();

    if (!current) throw new NotFoundError("Invoice item not found");

    const qty = params.quantity ?? current.quantity;
    const unitPrice = params.unit_price ?? current.unit_price;
    const discount = params.discount_amount ?? current.discount_amount;
    updates.total_price = Math.max(0, qty * unitPrice - discount);
  }

  const { data, error } = await supabase
    .from("invoice_items")
    .update(updates)
    .eq("id", itemId)
    .select(
      "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update invoice item");
  }

  // Recalculate invoice totals
  await recalculateInvoiceTotals(db, invoiceId, orgId);

  revalidateTag(cacheTags.invoice(invoiceId), "max");

  return data as unknown as unknown as InvoiceItem;
}

/**
 * Removes a line item from an invoice.
 * Hard-deletes the item record and recalculates totals.
 */
export async function removeInvoiceItem(
  db: SupabaseClient,
  itemId: string,
  invoiceId: string,
  orgId: string,
): Promise<void> {
  const supabase = db;

  const { error } = await supabase
    .from("invoice_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new NotFoundError("Invoice item not found");

  // Recalculate invoice totals
  await recalculateInvoiceTotals(db, invoiceId, orgId);

  revalidateTag(cacheTags.invoice(invoiceId), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
}

/**
 * Recalculates subtotal, tax_total, and total on an invoice
 * by summing its line items and re-applying discount/tax.
 */
async function recalculateInvoiceTotals(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
): Promise<void> {
  const supabase = db;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("total_price, discount_amount")
    .eq("invoice_id", invoiceId);

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + item.total_price,
    0,
  );

  const totalDiscount = (items ?? []).reduce(
    (sum, item) => sum + (item.discount_amount ?? 0),
    0,
  );

  // Read current invoice for existing tax/discount values
  const { data: invoice } = await supabase
    .from("invoices")
    .select("discount_total, tax_total")
    .eq("id", invoiceId)
    .single();

  const taxTotal = invoice?.tax_total ?? 0;
  const total = subtotal + taxTotal;

  const { error } = await supabase
    .from("invoices")
    .update({
      subtotal,
      discount_total: totalDiscount,
      total,
    })
    .eq("id", invoiceId)
    .eq("organization_id", orgId);

  if (error) {
    reportServerError("Failed to recalculate invoice totals:", error);
    throw new Error(`Failed to recalculate invoice totals: ${error.message}`);
  }
}

// ── Delete (soft) an invoice ──────────────────────
export async function deleteInvoice(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId_?: string,
): Promise<void> {
  const supabase = db;
  const userId = userId_ ?? (await supabase.auth.getUser()).data.user?.id;

  const { error } = await supabase
    .from("invoices")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) throw new NotFoundError("Invoice not found");
  revalidateTag(cacheTags.invoice(id), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
}
