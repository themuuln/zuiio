import { revalidateTag } from "next/cache";
import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type {
  Invoice,
  InvoiceWithItems,
  InvoiceItem,
  InvoicePayment,
} from "@/lib/database.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { sendInvoiceEmail } from "@/lib/services/email-service";

// ── Generate the next invoice number for an org ───
export async function generateInvoiceNumber(
  orgId: string,
): Promise<string> {
  const supabase = await createClient();

  // Get org settings for prefix
  const { data: settings } = await supabase
    .from("organization_settings")
    .select("invoice_prefix")
    .eq("organization_id", orgId)
    .single();

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
  orgId: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  },
): Promise<InvoiceWithItems[]> {
  const supabase = await createClient();

  return withCache(
    ["getInvoices", orgId, JSON.stringify(options ?? {})],
    async () => {
      let query = supabase
        .from("invoices")
        .select("*")
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
        query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message ?? "Failed to fetch invoices");
      return (data ?? []) as InvoiceWithItems[];
    },
    {
      tags: [cacheTags.invoices(orgId)],
      revalidate: cacheDurations.invoices,
    },
  );
}

// ── Get a single invoice by ID ────────────────────
export async function getInvoice(
  id: string,
): Promise<InvoiceWithItems> {
  const supabase = await createClient();

  return withCache(
    ["getInvoice", id],
    async () => {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error || !invoice) throw new NotFoundError("Invoice not found");

      const [{ data: items }, { data: payments }] = await Promise.all([
        supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("invoice_payments")
          .select("*")
          .eq("invoice_id", id)
          .order("paid_at", { ascending: false }),
      ]);

      return {
        ...invoice,
        items: (items ?? []) as InvoiceItem[],
        payments: (payments ?? []) as InvoicePayment[],
      } as InvoiceWithItems;
    },
    {
      tags: [cacheTags.invoice(id)],
      revalidate: cacheDurations.invoice,
    },
  );
}

// ── Get invoice by public token (no auth needed) ──
export async function getInvoiceByPublicToken(
  token: string,
): Promise<InvoiceWithItems> {
  const supabase = await createClient();

  return withCache(
    ["getInvoiceByPublicToken", token],
    async () => {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("public_token", token)
        .is("deleted_at", null)
        .single();

      if (error || !invoice) throw new NotFoundError("Invoice not found");

      const [{ data: items }, { data: payments }] = await Promise.all([
        supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoice.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("invoice_payments")
          .select("*")
          .eq("invoice_id", invoice.id)
          .order("paid_at", { ascending: false }),
      ]);

      return {
        ...invoice,
        items: (items ?? []) as InvoiceItem[],
        payments: (payments ?? []) as InvoicePayment[],
      } as InvoiceWithItems;
    },
    {
      tags: [cacheTags.invoice(token)],
      revalidate: cacheDurations.invoice,
    },
  );
}

// ── Create invoice from a work order ──────────────
export async function createInvoiceFromWorkOrder(
  orgId: string,
  workOrderId: string,
  options?: {
    dueDays?: number;
    notes?: string;
    terms?: string;
  },
): Promise<InvoiceWithItems> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Fetch work order with all dependencies
  const { data: wo } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .single();

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
    return getInvoice(existing.id);
  }

  // Fetch customer and vehicle data
  const [{ data: customer }, { data: vehicle }] = await Promise.all([
    wo.customer_id
      ? supabase.from("customers").select("*").eq("id", wo.customer_id).single()
      : { data: null },
    wo.vehicle_id
      ? supabase.from("vehicles").select("*").eq("id", wo.vehicle_id).single()
      : { data: null },
  ]);

  // Fetch services and parts
  const [{ data: services }, { data: parts }] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("*")
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_order_parts")
      .select("*")
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
  const discountTotal = Number(wo.discount_amount ?? 0) +
    (services ?? []).reduce(
      (sum, s) => sum + Number(s.discount_amount ?? 0),
      0,
    ) +
    (parts ?? []).reduce(
      (sum, p) => sum + Number(p.discount_amount ?? 0),
      0,
    );
  const total = Math.max(0, subtotal - discountTotal);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(orgId);

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

  // Create invoice
  const { data: invoice, error } = await supabase
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
      tax_total: 0,
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
    .select("*")
    .single();

  if (error || !invoice) {
    throw new Error(error?.message ?? "Failed to create invoice");
  }

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

  if (serviceItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(serviceItems);
    if (itemsError) throw new Error(itemsError.message);
  }

  if (partItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(partItems);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidateTag(cacheTags.invoices(orgId), "max");
  return getInvoice(invoice.id);
}

// ── Update invoice status ─────────────────────────
export async function updateInvoiceStatus(
  id: string,
  orgId: string,
  status: string,
  notes?: string,
): Promise<Invoice> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  const updateData: Record<string, unknown> = {
    status,
    updated_by: userId,
  };

  if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
    updateData.amount_paid = (
      await supabase
        .from("invoices")
        .select("total")
        .eq("id", id)
        .single()
    ).data?.total ?? 0;
    updateData.balance_due = 0;
  }

  if (status === "sent") {
    updateData.issued_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Invoice not found");
  revalidateTag(cacheTags.invoice(id), "max");
  revalidateTag(cacheTags.invoices(data.organization_id as string), "max");
  return data;
}

// ── Mark invoice as emailed ───────────────────────
export async function markInvoiceEmailed(
  id: string,
  orgId: string,
): Promise<Invoice> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .update({
      email_sent_at: new Date().toISOString(),
      status: "sent",
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) throw new NotFoundError("Invoice not found");
  revalidateTag(cacheTags.invoice(id), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
  return data;
}

export async function sendInvoiceAndMarkEmailed(
  invoiceId: string,
  orgId: string,
): Promise<{ emailed: boolean }> {
  const supabase = await createClient();

  const invoice = await getInvoice(invoiceId);

  if (!invoice.customer_email) {
    throw new ValidationError(
      "Invoice has no customer email address. Add an email to the customer first.",
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: branch } = await supabase
    .from("branches")
    .select("email")
    .eq("organization_id", orgId)
    .eq("is_main", true)
    .maybeSingle();

  const orgName = org?.name ?? "Your Mechanic Shop";
  const bccEmail = branch?.email ?? undefined;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicInvoiceUrl = `${siteUrl}/invoice/${invoice.public_token}`;

  await sendInvoiceEmail({
    invoice,
    orgName,
    recipientEmail: invoice.customer_email,
    bccEmail,
    publicInvoiceUrl,
  });

  await markInvoiceEmailed(invoiceId, orgId);

  return { emailed: true };
}

// ── Record a payment against an invoice ───────────
export async function recordPayment(
  invoiceId: string,
  orgId: string,
  payment: {
    amount: number;
    method?: string;
    reference?: string;
    notes?: string;
  },
): Promise<InvoicePayment[]> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Get current invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("organization_id", orgId)
    .single();

  if (!invoice) throw new NotFoundError("Invoice not found");

  // Record payment
  const { error } = await supabase.from("invoice_payments").insert({
    invoice_id: invoiceId,
    amount: payment.amount,
    method: payment.method ?? "cash",
    reference: payment.reference ?? null,
    notes: payment.notes ?? null,
    created_by: userId,
  });

  if (error) throw new Error(error.message ?? "Failed to record payment");

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

  const newStatus =
    balanceDue <= 0 ? "paid" : totalPaid > 0 ? "partial" : invoice.status;

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
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });

  return (updatedPayments ?? []) as InvoicePayment[];
}

// ── Get invoice count by status ───────────────────
export async function getInvoiceStats(
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
  const supabase = await createClient();

  return withCache(
    ["getInvoiceStats", orgId],
    async () => {
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
    },
    {
      tags: [cacheTags.invoices(orgId)],
      revalidate: cacheDurations.invoices,
    },
  );
}

// ── Delete (soft) an invoice ──────────────────────
export async function deleteInvoice(
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = await createClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;

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
