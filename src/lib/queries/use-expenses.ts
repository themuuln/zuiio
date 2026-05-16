import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { expenseKeys } from "@/lib/queries/keys";
import type {
  ExpenseWithCategory,
  ExpenseCategory,
  ExpenseStats,
  CreateExpenseParams,
  UpdateExpenseParams,
  CreateExpenseCategoryParams,
  UpdateExpenseCategoryParams,
} from "@/lib/types";

interface ExpenseListParams {
  q?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  paid?: boolean;
}

// ── List expenses ──
export function useExpenses(orgId: string | undefined, params?: ExpenseListParams) {
  const filters: Record<string, string> = {};
  if (params?.q) filters.q = params.q;
  if (params?.categoryId) filters.categoryId = params.categoryId;
  if (params?.startDate) filters.startDate = params.startDate;
  if (params?.endDate) filters.endDate = params.endDate;
  if (params?.paid !== undefined) filters.paid = String(params.paid);
  const searchParams = new URLSearchParams(filters).toString();

  return useQuery({
    queryKey: expenseKeys.list(orgId ?? "", filters),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/expenses${searchParams ? `?${searchParams}` : ""}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as ExpenseWithCategory[];
    },
    enabled: !!orgId,
  });
}

// ── Get single expense ──
export function useExpense(orgId: string | undefined, expenseId: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.detail(orgId ?? "", expenseId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/expenses/${expenseId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as ExpenseWithCategory;
    },
    enabled: !!orgId && !!expenseId,
  });
}

// ── Expense stats ──
export function useExpenseStats(orgId: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.stats(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/expenses?type=stats`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as ExpenseStats;
    },
    enabled: !!orgId,
  });
}

// ── Expense categories ──
export function useExpenseCategories(orgId: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.categories(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/expense-categories`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as ExpenseCategory[];
    },
    enabled: !!orgId,
  });
}

// ── Create expense ──
export function useCreateExpense(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateExpenseParams) => {
      const res = await fetch(`/api/organizations/${orgId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all(orgId) });
        queryClient.invalidateQueries({ queryKey: expenseKeys.stats(orgId) });
      }
      toast.success("Expense created");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to create expense");
    },
  });
}

// ── Update expense ──
export function useUpdateExpense(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateExpenseParams & { id: string }) => {
      const res = await fetch(`/api/organizations/${orgId}/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: (_, variables) => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.all(orgId) });
        queryClient.invalidateQueries({ queryKey: expenseKeys.detail(orgId, variables.id) });
        queryClient.invalidateQueries({ queryKey: expenseKeys.stats(orgId) });
      }
      toast.success("Expense updated");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to update expense");
    },
  });
}

// ── Delete expense ──
export function useDeleteExpense(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organizations/${orgId}/expenses/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
    },
    onSuccess: () => {
      if (orgId) queryClient.invalidateQueries({ queryKey: expenseKeys.all(orgId) });
      toast.success("Expense deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to delete expense");
    },
  });
}

// ── Create category ──
export function useCreateExpenseCategory(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateExpenseCategoryParams) => {
      const res = await fetch(`/api/organizations/${orgId}/expense-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      if (orgId) queryClient.invalidateQueries({ queryKey: expenseKeys.categories(orgId) });
      toast.success("Category created");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to create category");
    },
  });
}

// ── Update category ──
export function useUpdateExpenseCategory(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateExpenseCategoryParams & { id: string }) => {
      const res = await fetch(`/api/organizations/${orgId}/expense-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSuccess: () => {
      if (orgId) queryClient.invalidateQueries({ queryKey: expenseKeys.categories(orgId) });
      toast.success("Category updated");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to update category");
    },
  });
}

// ── Delete category ──
export function useDeleteExpenseCategory(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/organizations/${orgId}/expense-categories/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
    },
    onSuccess: () => {
      if (orgId) queryClient.invalidateQueries({ queryKey: expenseKeys.categories(orgId) });
      toast.success("Category deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to delete category");
    },
  });
}
