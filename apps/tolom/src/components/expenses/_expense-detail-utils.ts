import { z } from "zod";

// ── Constants ─────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "manual",
] as const;

// ── Schema ───────────────────────────────────────────────────

export const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  taxAmount: z.string().optional(),
  expenseDate: z.string().optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
  vendorName: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  paid: z.boolean(),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function syncForm(expense: {
  description: string;
  amount: number;
  tax_amount?: number | null;
  expense_date?: string | null;
  due_date?: string | null;
  category_id?: string | null;
  vendor_name?: string | null;
  payment_method?: string | null;
  reference_number?: string | null;
  paid_at?: string | null;
  notes?: string | null;
}): ExpenseFormValues {
  return {
    description: expense.description,
    amount: String(expense.amount),
    taxAmount: expense.tax_amount ? String(expense.tax_amount) : "",
    expenseDate: expense.expense_date ?? "",
    dueDate: expense.due_date ?? "",
    categoryId: expense.category_id ?? "",
    vendorName: expense.vendor_name ?? "",
    paymentMethod: expense.payment_method ?? "",
    referenceNumber: expense.reference_number ?? "",
    paid: !!expense.paid_at,
    notes: expense.notes ?? "",
  };
}

export function isOverdue(expense: {
  paid_at?: string | null;
  due_date?: string | null;
}) {
  return !!(
    !expense.paid_at &&
    expense.due_date &&
    new Date(expense.due_date) < new Date()
  );
}
