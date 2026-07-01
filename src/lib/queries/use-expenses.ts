import { useQuery } from "@tanstack/react-query";
import type {
  CreateExpenseCategoryParams,
  CreateExpenseParams,
  ExpenseCategory,
  ExpenseStats,
  ExpenseWithCategory,
  UpdateExpenseCategoryParams,
  UpdateExpenseParams,
} from "@/lib/types";
import { createOrgQuery } from "./factory";
import { expenseKeys } from "./keys";
import { useOrgMutation } from "@zuiio/query";

interface ExpenseListParams {
  q?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  paid?: boolean;
  overdue?: boolean;
  branchId?: string;
}

// ── List expenses ──
const fetchExpenses = createOrgQuery<ExpenseWithCategory[]>("/expenses");

export function useExpenses(
  orgId: string | undefined,
  params?: ExpenseListParams,
) {
  const filters: Record<string, string> = {};
  if (params?.q) filters.q = params.q;
  if (params?.categoryId) filters.categoryId = params.categoryId;
  if (params?.startDate) filters.startDate = params.startDate;
  if (params?.endDate) filters.endDate = params.endDate;
  if (params?.paid !== undefined) filters.paid = String(params.paid);
  if (params?.overdue) filters.overdue = "true";
  if (params?.branchId) filters.branch_id = params.branchId;

  return useQuery({
    queryKey: expenseKeys.list(orgId ?? "", filters),
    queryFn: () =>
      fetchExpenses(orgId!, {
        params: Object.keys(filters).length ? filters : undefined,
      }),
    enabled: !!orgId,
  });
}

// ── Get single expense ──
export function useExpense(
  orgId: string | undefined,
  expenseId: string | undefined,
) {
  const fetchExpense = createOrgQuery<ExpenseWithCategory>(
    `/expenses/${expenseId ?? ""}`,
  );
  return useQuery({
    queryKey: expenseKeys.detail(orgId ?? "", expenseId ?? ""),
    queryFn: () => fetchExpense(orgId!),
    enabled: !!orgId && !!expenseId,
  });
}

// ── Expense stats ──
const fetchExpenseStats = createOrgQuery<ExpenseStats>("/expenses");

export function useExpenseStats(
  orgId: string | undefined,
  branchId?: string | null,
) {
  return useQuery({
    queryKey: expenseKeys.stats(orgId ?? "", branchId ?? "all"),
    queryFn: () =>
      fetchExpenseStats(orgId!, {
        params: {
          type: "stats",
          ...(branchId ? { branch_id: branchId } : {}),
        },
      }),
    enabled: !!orgId,
  });
}

// ── Expense categories ──
const fetchExpenseCategories = createOrgQuery<ExpenseCategory[]>(
  "/expense-categories",
);

export function useExpenseCategories(orgId: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.categories(orgId ?? ""),
    queryFn: () => fetchExpenseCategories(orgId!),
    enabled: !!orgId,
  });
}

// ── Create expense ──
export function useCreateExpense(orgId: string | undefined) {
  return useOrgMutation<ExpenseWithCategory, CreateExpenseParams>({
    endpoint: `/api/organizations/${orgId}/expenses`,
    method: "POST",
    queryKey: expenseKeys.all(orgId ?? ""),
    invalidateKeys: [expenseKeys.stats(orgId ?? "")],
    successMessage: "Expense created",
  });
}

// ── Update expense ──
export function useUpdateExpense(orgId: string | undefined) {
  return useOrgMutation<
    ExpenseWithCategory,
    UpdateExpenseParams & { id: string }
  >({
    endpoint: (vars) => `/api/organizations/${orgId}/expenses/${vars.id}`,
    method: "PATCH",
    queryKey: expenseKeys.all(orgId ?? ""),
    invalidateKeys: [expenseKeys.stats(orgId ?? "")],
    successMessage: "Expense updated",
  });
}

// ── Delete expense ──
export function useDeleteExpense(orgId: string | undefined) {
  return useOrgMutation<unknown, string>({
    endpoint: (id) => `/api/organizations/${orgId}/expenses/${id}`,
    method: "DELETE",
    queryKey: expenseKeys.all(orgId ?? ""),
    successMessage: "Expense deleted",
  });
}

// ── Create category (optimistic) ──
export function useCreateExpenseCategory(orgId: string | undefined) {
  return useOrgMutation<ExpenseCategory, CreateExpenseCategoryParams>({
    endpoint: `/api/organizations/${orgId}/expense-categories`,
    method: "POST",
    queryKey: expenseKeys.categories(orgId ?? ""),
    optimisticUpdate: (cached, params) => {
      const optimistic: ExpenseCategory = {
        id: `temp-${Date.now()}`,
        organization_id: orgId ?? "",
        name: params.name,
        description: params.description ?? null,
        color: "",
        icon: "",
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [...cached, optimistic];
    },
    successMessage: "Category created",
  });
}

// ── Update category (optimistic) ──
export function useUpdateExpenseCategory(orgId: string | undefined) {
  return useOrgMutation<
    ExpenseCategory,
    UpdateExpenseCategoryParams & { id: string }
  >({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/expense-categories/${vars.id}`,
    method: "PATCH",
    queryKey: expenseKeys.categories(orgId ?? ""),
    optimisticUpdate: (cached, vars) => {
      const { id, ...params } = vars;
      return cached.map((c) =>
        c.id === id
          ? { ...c, ...params, updated_at: new Date().toISOString() }
          : c,
      );
    },
    successMessage: "Category updated",
  });
}

// ── Delete category (optimistic) ──
export function useDeleteExpenseCategory(orgId: string | undefined) {
  return useOrgMutation<ExpenseCategory, string>({
    endpoint: (id) => `/api/organizations/${orgId}/expense-categories/${id}`,
    method: "DELETE",
    queryKey: expenseKeys.categories(orgId ?? ""),
    optimisticUpdate: (cached, id) => cached.filter((c) => c.id !== id),
    successMessage: "Category deleted",
  });
}
