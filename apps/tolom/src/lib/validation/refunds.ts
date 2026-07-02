import { z } from "zod";

// ── Refund Methods ──────────────────────────────────────────────

const REFUND_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "store_credit",
] as const;

// ── Record Refund Schema ──────────────────────────────────────

export const recordRefundSchema = z.object({
  invoice_id: z.string().uuid("Invalid invoice ID"),
  amount: z.number().positive("Refund amount must be positive"),
  method: z.enum(REFUND_METHODS).default("cash"),
  reason: z.string().max(500, "Reason must be under 500 characters").optional(),
  reference: z
    .string()
    .max(200, "Reference must be under 200 characters")
    .optional(),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

export type RecordRefundInput = z.infer<typeof recordRefundSchema>;

// ── Refund List Params Schema ──────────────────────────────────

export const refundListParamsSchema = z.object({
  status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export type RefundListParams = z.infer<typeof refundListParamsSchema>;
