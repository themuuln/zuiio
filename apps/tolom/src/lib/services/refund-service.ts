import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  InvoiceRefund,
  RefundStats,
  RefundWithInvoice,
} from "@/lib/types";
import type { CreateRefundParams } from "@/lib/types/refund";

/**
 * Record a refund for an invoice.
 * Validates that the refund doesn't exceed the paid amount.
 * Updates invoice.amount_refunded and status atomically.
 */
export async function recordRefund(
  db: SupabaseClient,
  invoiceId: string,
  orgId: string,
  refund: CreateRefundParams,
): Promise<InvoiceRefund[]> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Use atomic function to prevent race conditions
  const { error } = await supabase.rpc("record_refund_atomically", {
    p_invoice_id: invoiceId,
    p_organization_id: orgId,
    p_amount: refund.amount,
    p_method: refund.method,
    p_reason: refund.reason ?? undefined,
    p_reference: refund.reference ?? undefined,
    p_notes: refund.notes ?? undefined,
    p_created_by: userId ?? undefined,
  });

  if (error) throw new Error(error.message ?? "Failed to record refund");

  const { data: newRefund } = await supabase
    .from("invoice_refunds")
    .select(
      "id, invoice_id, organization_id, amount, method, status, reason, reference, notes, refunded_at, created_at, updated_at, created_by",
    )
    .eq("invoice_id", invoiceId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  logAuditAfter({
    supabase,
    action: "create",
    table_name: "invoice_refunds",
    record_id: newRefund?.id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    new_data: newRefund ?? {
      invoice_id: invoiceId,
      amount: refund.amount,
      method: refund.method,
      reason: refund.reason ?? null,
      reference: refund.reference ?? null,
      notes: refund.notes ?? null,
    },
  });

  revalidateTag(cacheTags.invoice(invoiceId), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
  revalidateTag(cacheTags.refunds(orgId), "max");

  // Return updated refunds for the invoice
  const { data: updatedRefunds } = await supabase
    .from("invoice_refunds")
    .select(
      "id, invoice_id, organization_id, amount, method, status, reason, reference, notes, refunded_at, created_at, updated_at, created_by",
    )
    .eq("invoice_id", invoiceId)
    .order("refunded_at", { ascending: false });

  return (updatedRefunds ?? []) as unknown as InvoiceRefund[];
}

/**
 * List all refunds for an organization with optional filters.
 * Joins invoice data for display in list views.
 */
export async function getRefunds(
  db: SupabaseClient,
  orgId: string,
  options?: {
    status?: "pending" | "completed" | "failed" | "cancelled";
    limit?: number;
    offset?: number;
  },
): Promise<RefundWithInvoice[]> {
  const supabase = db;

  let query = supabase
    .from("invoice_refunds")
    .select(
      `
      id, invoice_id, organization_id, amount, method, status, reason, reference, notes, refunded_at, created_at, updated_at, created_by,
      invoices!inner(invoice_number, total, customer_name)
    `,
    )
    .eq("organization_id", orgId)
    .order("refunded_at", { ascending: false });

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

  if (error) throw new Error(error.message ?? "Failed to fetch refunds");

  // Transform to include invoice data at top level
  return (data ?? []).map((refund: Record<string, unknown>) => ({
    ...refund,
    invoice_number: (refund.invoices as Record<string, unknown>)
      ?.invoice_number as string,
    invoice_total: Number(
      (refund.invoices as Record<string, unknown>)?.total ?? 0,
    ),
    customer_name: (refund.invoices as Record<string, unknown>)
      ?.customer_name as string | null,
  })) as unknown as RefundWithInvoice[];
}

/**
 * Get all refunds for a specific invoice.
 */
export async function getInvoiceRefunds(
  db: SupabaseClient,
  invoiceId: string,
): Promise<InvoiceRefund[]> {
  const supabase = db;

  const { data, error } = await supabase
    .from("invoice_refunds")
    .select(
      "id, invoice_id, organization_id, amount, method, status, reason, reference, notes, refunded_at, created_at, updated_at, created_by",
    )
    .eq("invoice_id", invoiceId)
    .order("refunded_at", { ascending: false });

  if (error) throw new Error(error.message ?? "Failed to fetch refunds");

  return (data ?? []) as unknown as InvoiceRefund[];
}

/**
 * Get aggregated refund statistics for dashboard KPIs.
 */
export async function getRefundStats(
  db: SupabaseClient,
  orgId: string,
): Promise<RefundStats> {
  const supabase = db;

  const { data: refunds } = await supabase
    .from("invoice_refunds")
    .select("amount, status")
    .eq("organization_id", orgId);

  const all = refunds ?? [];

  return {
    totalRefunded: all
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + Number(r.amount), 0),
    refundCount: all.filter((r) => r.status === "completed").length,
    pendingAmount: all
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.amount), 0),
  };
}

/**
 * Cancel a pending refund.
 * Only pending refunds can be cancelled.
 */
export async function cancelRefund(
  db: SupabaseClient,
  refundId: string,
  orgId: string,
): Promise<InvoiceRefund> {
  const supabase = db;
  const userId = (await supabase.auth.getUser()).data.user?.id;

  // Get the refund
  const { data: refund } = await supabase
    .from("invoice_refunds")
    .select("id, status, invoice_id, organization_id")
    .eq("id", refundId)
    .eq("organization_id", orgId)
    .single();

  if (!refund) throw new NotFoundError("Refund not found");

  // Only pending refunds can be cancelled
  if (refund.status !== "pending") {
    throw new ValidationError(
      `Cannot cancel refund with status "${refund.status}". Only pending refunds can be cancelled.`,
    );
  }

  // Update status
  const { data, error } = await supabase
    .from("invoice_refunds")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", refundId)
    .select(
      "id, invoice_id, organization_id, amount, method, status, reason, reference, notes, refunded_at, created_at, updated_at, created_by",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cancel refund");
  }

  logAuditAfter({
    supabase,
    action: "update",
    table_name: "invoice_refunds",
    record_id: refundId,
    user_id: userId ?? undefined,
    organization_id: orgId,
    old_data: {
      id: refund.id,
      status: refund.status,
      invoice_id: refund.invoice_id,
    },
    new_data: { status: "cancelled" },
  });

  revalidateTag(cacheTags.invoice(refund.invoice_id), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
  revalidateTag(cacheTags.refunds(orgId), "max");

  return data as unknown as InvoiceRefund;
}
