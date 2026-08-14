/**
 * Push notification triggers for business events.
 * Called from API routes / server actions when important events occur.
 *
 * Usage:
 *   import { notifyWorkOrderAssigned } from "@/lib/services/push-triggers";
 *   await notifyWorkOrderAssigned(supabase, { mechanicId, workOrderNumber, bayNumber });
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "./push-service";

interface WorkOrderAssignedParams {
  mechanicId: string;
  workOrderNumber: string;
  bayNumber: number | null;
}

interface InvoiceParams {
  userId: string;
  invoiceNumber: string;
  total: number;
}

interface PaymentParams {
  userId: string;
  amount: number;
  workOrderNumber: string;
}

/**
 * Notify a mechanic when a work order is assigned to them.
 */
export async function notifyWorkOrderAssigned(
  supabase: SupabaseClient,
  params: WorkOrderAssignedParams,
): Promise<void> {
  const bayText = params.bayNumber
    ? ` — ${params.bayNumber} дугаарын байр`
    : "";

  await sendPushToUser(supabase, params.mechanicId, {
    title: "Шинэ ажлын захиалга",
    body: `Ажлын захиалга #${params.workOrderNumber} танд оноогдлоо${bayText}`,
    url: `/dashboard/bay-view`,
    tag: `work-order-${params.workOrderNumber}`,
  });
}

/**
 * Notify when an invoice is sent to a customer.
 */
export async function notifyInvoiceSent(
  supabase: SupabaseClient,
  params: InvoiceParams,
): Promise<void> {
  const formatted = new Intl.NumberFormat("mn-MN").format(params.total);

  await sendPushToUser(supabase, params.userId, {
    title: "Нэхэмжлэл илгээсэн",
    body: `Нэхэмжлэл #${params.invoiceNumber} (${formatted} ₮) илгээгдлээ`,
    url: `/dashboard/finance`,
    tag: `invoice-${params.invoiceNumber}`,
  });
}

/**
 * Notify when a payment is received.
 */
export async function notifyPaymentReceived(
  supabase: SupabaseClient,
  params: PaymentParams,
): Promise<void> {
  const formatted = new Intl.NumberFormat("mn-MN").format(params.amount);

  await sendPushToUser(supabase, params.userId, {
    title: "Төлбөр хүлээн авлаа",
    body: `${formatted} ₮ төлбөр хүлээн авлаа (Ажлын захиалга #${params.workOrderNumber})`,
    url: `/dashboard/finance`,
    tag: `payment-${params.workOrderNumber}`,
  });
}
