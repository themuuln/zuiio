/**
 * Expense domain types.
 */

export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  branch_id: string | null;
  category_id: string | null;
  vendor_name: string | null;
  description: string;
  amount: number;
  tax_amount: number;
  expense_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  reference_number: string | null;
  receipt_url: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category?: ExpenseCategory | null;
}

export interface CreateExpenseParams {
  categoryId?: string;
  vendorName?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  expenseDate?: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string;
  referenceNumber?: string;
  receiptUrl?: string | null;
  notes?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  branchId?: string;
}

export interface UpdateExpenseParams {
  categoryId?: string | null;
  vendorName?: string | null;
  description?: string;
  amount?: number;
  taxAmount?: number;
  expenseDate?: string;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
  recurrenceInterval?: string | null;
}

export interface CreateExpenseCategoryParams {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateExpenseCategoryParams {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  totalTax: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueCount: number;
  byCategory: {
    category_id: string | null;
    category_name: string;
    total: number;
    count: number;
  }[];
  thisMonth: number;
  lastMonth: number;
}
