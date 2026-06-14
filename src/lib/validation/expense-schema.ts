import { z } from "zod";

// ── Expense Payment Methods ────────────────────────────────────

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "manual",
] as const;

// ── Expense Schema ─────────────────────────────────────────────

export const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const n = Number(val);
      return !Number.isNaN(n) && n > 0;
    }, "Enter a valid amount"),
  expenseDate: z.string().optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
  vendorName: z.string().optional(),
  taxAmount: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  referenceNumber: z.string().optional(),
  paid: z.boolean(),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// ── Expense Category Schema ────────────────────────────────────

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;
