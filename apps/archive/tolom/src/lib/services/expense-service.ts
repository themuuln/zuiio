import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { resolveBranchId, withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  CreateExpenseCategoryParams,
  CreateExpenseParams,
  Expense,
  ExpenseCategory,
  ExpenseStats,
  ExpenseWithCategory,
  UpdateExpenseCategoryParams,
  UpdateExpenseParams,
} from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";
import { createCrudService } from "./create-crud-service";
import { trimField } from "./trim-field";

// ── Factory for expense_categories ──────────────────────────────

const categoryCrud = createCrudService<
  ExpenseCategory,
  CreateExpenseCategoryParams,
  UpdateExpenseCategoryParams
>({
  tableName: "expense_categories",
  selectColumns:
    "id, organization_id, name, description, color, icon, sort_order, is_active, created_at, updated_at, deleted_at",
  selectColumnsById:
    "id, organization_id, name, description, color, icon, sort_order, is_active, created_by, updated_by, created_at, updated_at",
  cacheTagKey: (orgId: string) => cacheTags.expenseCategories(orgId),
  fieldMap: {
    columns: {
      name: "name",
      description: "description",
      color: "color",
      icon: "icon",
      sortOrder: "sort_order",
      isActive: "is_active",
    },
    transforms: {
      name: trimField,
      description: trimField,
    },
  },
  orderBy: { column: "sort_order", direction: "asc" },
  hooks: {
    beforeCreate: async (params, ctx) => {
      if (!params.name?.trim()) {
        throw new ValidationError("Category name is required");
      }
      // Check for duplicate
      const { data: existing } = await ctx.db
        .from("expense_categories")
        .select("id")
        .eq("organization_id", ctx.orgId)
        .eq("name", params.name.trim())
        .is("deleted_at", null)
        .maybeSingle();
      if (existing) {
        throw new ConflictError("A category with this name already exists");
      }
      return {
        name: params.name.trim(),
        description: params.description?.trim() ?? null,
        color: params.color ?? "#6b7280",
        icon: params.icon ?? "receipt",
        sort_order: params.sortOrder ?? 0,
      } as Partial<CreateExpenseCategoryParams>;
    },
  },
});

// ── Factory for expenses ───────────────────────────────────────

const expenseCrud = createCrudService<
  Expense,
  CreateExpenseParams,
  UpdateExpenseParams
>({
  tableName: "expenses",
  selectColumns:
    "id, organization_id, branch_id, category_id, vendor_name, description, amount, tax_amount, expense_date, due_date, paid_at, payment_method, reference_number, receipt_url, notes, is_recurring, recurrence_interval, created_by, updated_by, created_at, updated_at",
  cacheTagKey: (orgId: string) => cacheTags.expenses(orgId),
});

const expenseFieldMap: FieldMap<UpdateExpenseParams> = {
  columns: {
    categoryId: "category_id",
    vendorName: "vendor_name",
    description: "description",
    amount: "amount",
    taxAmount: "tax_amount",
    expenseDate: "expense_date",
    dueDate: "due_date",
    paidAt: "paid_at",
    paymentMethod: "payment_method",
    referenceNumber: "reference_number",
    receiptUrl: "receipt_url",
    notes: "notes",
    isRecurring: "is_recurring",
    recurrenceInterval: "recurrence_interval",
  },
  transforms: {
    vendorName: trimField,
    description: trimField,
    referenceNumber: trimField,
    notes: trimField,
    paymentMethod: (v) => (v as string) || null,
    recurrenceInterval: (v) => (v as string) || null,
  },
};

const DEFAULT_CATEGORIES = [
  {
    name: "Rent & Utilities",
    color: "#3b82f6",
    icon: "building2",
    sortOrder: 1,
  },
  { name: "Salaries & Wages", color: "#8b5cf6", icon: "users", sortOrder: 2 },
  { name: "Parts & Supplies", color: "#f59e0b", icon: "package", sortOrder: 3 },
  { name: "Equipment & Tools", color: "#10b981", icon: "wrench", sortOrder: 4 },
  {
    name: "Marketing & Advertising",
    color: "#ec4899",
    icon: "megaphone",
    sortOrder: 5,
  },
  { name: "Insurance", color: "#06b6d4", icon: "shield", sortOrder: 6 },
  { name: "Taxes & Licenses", color: "#ef4444", icon: "receipt", sortOrder: 7 },
  {
    name: "Transportation & Fuel",
    color: "#f97316",
    icon: "truck",
    sortOrder: 8,
  },
  {
    name: "Office Expenses",
    color: "#6366f1",
    icon: "notebook-pen",
    sortOrder: 9,
  },
  { name: "Other", color: "#6b7280", icon: "ellipsis", sortOrder: 10 },
];

/**
 * Seeds default expense categories for an org if none exist yet.
 */
export async function seedDefaultExpenseCategories(
  db: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<void> {
  const supabase = db;
  const { count } = await supabase
    .from("expense_categories")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (count && count > 0) return;

  const { error } = await supabase.from("expense_categories").insert(
    DEFAULT_CATEGORIES.map((cat) => ({
      organization_id: orgId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      sort_order: cat.sortOrder,
      created_by: userId,
      updated_by: userId,
    })),
  );

  if (error) throw new Error(error.message);
  revalidateTag(cacheTags.expenseCategories(orgId), "max");
}

// ── Get expenses list ──────────────────────────────
export async function getExpenses(
  db: SupabaseClient,
  orgId: string,
  options?: {
    search?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    paid?: boolean;
    limit?: number;
    offset?: number;
    overdue?: boolean;
    branchId?: string | null;
  },
): Promise<ExpenseWithCategory[]> {
  const supabase = db;
  const todayStr = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("expenses")
    .select(
      "id, organization_id, branch_id, category_id, vendor_name, description, amount, tax_amount, expense_date, due_date, paid_at, payment_method, reference_number, receipt_url, notes, is_recurring, recurrence_interval, created_at, updated_at, deleted_at, category:expense_categories(id, name, color, icon)",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false });

  if (options?.branchId) query = withBranchFilter(query, options.branchId);

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.startDate) {
    query = query.gte("expense_date", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("expense_date", options.endDate);
  }

  if (options?.paid !== undefined) {
    if (options.paid) {
      query = query.not("paid_at", "is", null);
    } else {
      query = query.is("paid_at", null);
    }
  }

  if (options?.overdue) {
    query = query.is("paid_at", null).lt("due_date", todayStr);
  }

  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(
      `description.ilike.${term},vendor_name.ilike.${term},reference_number.ilike.${term}`,
    );
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset !== undefined && options?.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message ?? "Failed to fetch expenses");

  return (data ?? []).map((row: Record<string, unknown>) => {
    const cat = (row.category ?? row.expense_categories) as unknown as Record<
      string,
      unknown
    > | null;
    const {
      category: _category,
      expense_categories: _expenseCategories,
      ...expense
    } = row;
    return {
      ...expense,
      category: cat ?? null,
    } as unknown as ExpenseWithCategory;
  });
}

// ── Get single expense ─────────────────────────────
export async function getExpense(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<ExpenseWithCategory> {
  const supabase = db;
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_categories(*)")
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Expense not found");

  const cat = data.expense_categories as unknown as Record<
    string,
    unknown
  > | null;
  const { expense_categories: _, ...expense } = data;
  return {
    ...expense,
    category: cat ?? null,
  } as unknown as ExpenseWithCategory;
}

// ── Get expense stats ──────────────────────────────
export async function getExpenseStats(
  db: SupabaseClient,
  orgId: string,
  branchId?: string | null,
): Promise<ExpenseStats> {
  const supabase = db;
  let query = supabase
    .from("expenses")
    .select(
      "id, amount, tax_amount, paid_at, due_date, expense_date, category_id, expense_categories(name)",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (branchId) query = withBranchFilter(query, branchId);

  const { data: allExpenses } = await query;

  const expenses = (allExpenses ?? []) as unknown as Array<
    Record<string, unknown>
  >;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const byCategoryMap = new Map<
    string,
    {
      category_id: string | null;
      category_name: string;
      total: number;
      count: number;
    }
  >();

  let totalAmount = 0;
  let totalTax = 0;
  let paidAmount = 0;
  let thisMonthTotal = 0;
  let lastMonthTotal = 0;
  let overdueCount = 0;

  for (const exp of expenses) {
    const amount = Number(exp.amount ?? 0);
    const tax = Number(exp.tax_amount ?? 0);
    const catId = (exp.category_id as string) ?? "__uncategorized__";
    const catName =
      ((exp.expense_categories as Record<string, unknown>)?.name as string) ??
      "Uncategorized";

    totalAmount += amount;
    totalTax += tax;

    if (exp.paid_at) {
      paidAmount += amount;
    } else {
      // Count overdue: unpaid and due_date is in the past
      const dueDate = exp.due_date as string | null;
      if (dueDate && dueDate < todayStr) {
        overdueCount++;
      }
    }

    const expenseMonth = String(exp.expense_date ?? "").slice(0, 7);
    if (expenseMonth === thisMonth) thisMonthTotal += amount;
    if (expenseMonth === lastMonth) lastMonthTotal += amount;

    const existing = byCategoryMap.get(catId) ?? {
      category_id: exp.category_id as string | null,
      category_name: catName,
      total: 0,
      count: 0,
    };
    existing.total += amount;
    existing.count += 1;
    byCategoryMap.set(catId, existing);
  }

  return {
    totalExpenses: expenses.length,
    totalAmount,
    totalTax,
    paidAmount,
    unpaidAmount: totalAmount - paidAmount,
    overdueCount,
    byCategory: Array.from(byCategoryMap.values()).sort(
      (a, b) => b.total - a.total,
    ),
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
  };
}

// ── Create expense ─────────────────────────────────
export async function createExpense(
  db: SupabaseClient,
  orgId: string,
  params: CreateExpenseParams,
  userId: string,
): Promise<Expense> {
  if (!params.description?.trim()) {
    throw new ValidationError("Description is required");
  }

  if (!params.amount || params.amount <= 0) {
    throw new ValidationError("Amount must be greater than 0");
  }

  const supabase = db;

  const resolvedBranchId = await resolveBranchId(db, orgId, params.branchId, {
    strict: false,
  });

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: orgId,
      branch_id: resolvedBranchId,
      category_id: params.categoryId ?? null,
      vendor_name: params.vendorName?.trim() || null,
      description: params.description.trim(),
      amount: params.amount,
      tax_amount: params.taxAmount ?? 0,
      expense_date: params.expenseDate ?? new Date().toISOString().slice(0, 10),
      due_date: params.dueDate ?? null,
      paid_at: params.paidAt ?? null,
      payment_method: params.paymentMethod ?? null,
      reference_number: params.referenceNumber?.trim() || null,
      receipt_url: params.receiptUrl ?? null,
      notes: params.notes?.trim() || null,
      is_recurring: params.isRecurring ?? false,
      recurrence_interval: params.recurrenceInterval ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, organization_id, branch_id, category_id, vendor_name, description, amount, tax_amount, expense_date, due_date, paid_at, payment_method, reference_number, receipt_url, notes, is_recurring, recurrence_interval, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create expense");
  }

  logAuditAfter({
    supabase,
    action: "create",
    table_name: "expenses",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.expenses(orgId), "max");

  return data;
}

// ── Update expense ─────────────────────────────────
export async function updateExpense(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateExpenseParams,
  userId: string,
): Promise<Expense> {
  const supabase = db;
  const { data: existing, error: fetchError } = await supabase
    .from("expenses")
    .select(
      "id, organization_id, branch_id, category_id, vendor_name, description, amount, tax_amount, expense_date, due_date, paid_at, payment_method, reference_number, receipt_url, notes, is_recurring, recurrence_interval, created_by, updated_by, created_at, updated_at",
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError("Expense not found");
  }

  const updates = buildUpdates(params, expenseFieldMap);
  updates.updated_by = userId;

  if (Object.keys(updates).length <= 1) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, branch_id, category_id, vendor_name, description, amount, tax_amount, expense_date, due_date, paid_at, payment_method, reference_number, receipt_url, notes, is_recurring, recurrence_interval, created_by, updated_by, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update expense");
  }

  logAuditAfter({
    supabase,
    action: "update",
    table_name: "expenses",
    record_id: id,
    user_id: userId,
    organization_id: orgId,
    old_data: existing as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.expenses(orgId), "max");
  revalidateTag(cacheTags.expense(id), "max");

  return data;
}

// ── Delete expense (soft) ──────────────────────────
export async function deleteExpense(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId: string,
): Promise<void> {
  await expenseCrud.softDelete(db, orgId, id, userId);
}

// ── Get expense categories ─────────────────────────
export async function getExpenseCategories(
  db: SupabaseClient,
  orgId: string,
): Promise<ExpenseCategory[]> {
  const result = await categoryCrud.getAll(db, orgId, { pageSize: 1000 });
  return result.data;
}

// ── Create expense category ────────────────────────
export async function createExpenseCategory(
  db: SupabaseClient,
  orgId: string,
  params: CreateExpenseCategoryParams,
  userId: string,
): Promise<ExpenseCategory> {
  return categoryCrud.create(db, orgId, params, userId);
}

// ── Update expense category ────────────────────────
export async function updateExpenseCategory(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: UpdateExpenseCategoryParams,
  userId: string,
): Promise<ExpenseCategory> {
  return categoryCrud.update(db, orgId, id, params, userId);
}

// ── Delete expense category (soft) ─────────────────
export async function deleteExpenseCategory(
  db: SupabaseClient,
  id: string,
  orgId: string,
  userId: string,
): Promise<void> {
  await categoryCrud.softDelete(db, orgId, id, userId);
}
