/**
 * Refund-specific types — extend core DB types with related entity data.
 * Used by refund queries and API responses.
 */
import type { InvoiceRefund } from "./core";

/**
 * Refund with joined invoice data for list views.
 */
export interface RefundWithInvoice extends InvoiceRefund {
  invoice_number: string;
  invoice_total: number;
  customer_name: string | null;
}

/**
 * Parameters for creating a new refund.
 */
export interface CreateRefundParams {
  amount: number;
  method: "cash" | "card" | "bank_transfer" | "store_credit";
  reason?: string;
  reference?: string;
  notes?: string;
}

/**
 * Aggregated refund statistics for dashboard KPIs.
 */
export interface RefundStats {
  totalRefunded: number;
  refundCount: number;
  pendingAmount: number;
}
