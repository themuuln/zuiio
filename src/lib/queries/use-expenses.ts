import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";
import { expenseKeys } from "@/lib/queries/keys";
import { toastRetry } from "@/lib/toast-utils";
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
  if (params?.branchId) filters.branchId = params.branchId;

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

export function useExpenseStats(orgId: string | undefined) {
  return useQuery({
    queryKey: expenseKeys.stats(orgId ?? ""),
    queryFn: () => fetchExpenseStats(orgId!, { params: { type: "stats" } }),
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
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (params: CreateExpenseParams) => {
      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/expenses`,
        method: "POST",
        body: params,
        queryKeysToInvalidate: [[...expenseKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId) {
          queryClient.invalidateQueries({ queryKey: expenseKeys.all(orgId) });
          queryClient.invalidateQueries({ queryKey: expenseKeys.stats(orgId) });
        }
        toast.dismiss();
        toast.success("Expense created");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message ?? "Failed to create expense", () =>
        mutation.mutateAsync(variables),
      );
    },
  });
  return mutation;
}

// ── Update expense ──
export function useUpdateExpense(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...params
    }: UpdateExpenseParams & { id: string }) => {
      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/expenses/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/expenses/${id}`,
        method: "PATCH",
        body: params,
        queryKeysToInvalidate: [[...expenseKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onSuccess: (data, _variables, _context) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId) {
          queryClient.invalidateQueries({ queryKey: expenseKeys.all(orgId) });
          queryClient.invalidateQueries({
            queryKey: expenseKeys.detail(orgId, _variables.id),
          });
          queryClient.invalidateQueries({ queryKey: expenseKeys.stats(orgId) });
        }
        toast.dismiss();
        toast.success("Expense updated");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message ?? "Failed to update expense", () =>
        mutation.mutateAsync(variables),
      );
    },
  });
  return mutation;
}

// ── Delete expense ──
export function useDeleteExpense(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        const res = await fetch(`/api/organizations/${orgId}/expenses/${id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/expenses/${id}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [[...expenseKeys.all(orgId ?? "")]],
      });
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        if (orgId)
          queryClient.invalidateQueries({ queryKey: expenseKeys.all(orgId) });
        toast.dismiss();
        toast.success("Expense deleted");
      }
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message ?? "Failed to delete expense", () =>
        mutation.mutateAsync(variables),
      );
    },
  });
  return mutation;
}

// ── Create category (optimistic) ──
export function useCreateExpenseCategory(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (params: CreateExpenseCategoryParams) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/expense-categories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/expense-categories`,
        method: "POST",
        body: params,
        queryKeysToInvalidate: [[...expenseKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onMutate: async (params) => {
      const key = expenseKeys.categories(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ExpenseCategory[]>(key);
      if (previous) {
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
        queryClient.setQueryData<ExpenseCategory[]>(key, [
          ...previous,
          optimistic,
        ]);
      }
      return { previous };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previous)
        queryClient.setQueryData<ExpenseCategory[]>(
          expenseKeys.categories(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message ?? "Failed to create category", () =>
        mutation.mutateAsync(variables),
      );
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.dismiss();
        toast.success("Category created");
      }
    },
    onSettled: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: expenseKeys.categories(orgId),
        });
    },
  });
  return mutation;
}

// ── Update category (optimistic) ──
export function useUpdateExpenseCategory(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      ...params
    }: UpdateExpenseCategoryParams & { id: string }) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/expense-categories/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/expense-categories/${id}`,
        method: "PATCH",
        body: params,
        queryKeysToInvalidate: [[...expenseKeys.all(orgId ?? "")]],
      });
      return { queued: true } as unknown as unknown;
    },
    onMutate: async ({ id, ...params }) => {
      const key = expenseKeys.categories(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ExpenseCategory[]>(key);
      if (previous) {
        queryClient.setQueryData<ExpenseCategory[]>(
          key,
          previous.map((c) =>
            c.id === id
              ? { ...c, ...params, updated_at: new Date().toISOString() }
              : c,
          ),
        );
      }
      return { previous };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previous)
        queryClient.setQueryData<ExpenseCategory[]>(
          expenseKeys.categories(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message ?? "Failed to update category", () =>
        mutation.mutateAsync(variables),
      );
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown>;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.dismiss();
        toast.success("Category updated");
      }
    },
    onSettled: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: expenseKeys.categories(orgId),
        });
    },
  });
  return mutation;
}

// ── Delete category (optimistic) ──
export function useDeleteExpenseCategory(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const queue = useMutationQueue();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (isOnline) {
        const res = await fetch(
          `/api/organizations/${orgId}/expense-categories/${id}`,
          {
            method: "DELETE",
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return;
      }

      await queue.enqueue({
        endpoint: `/api/organizations/${orgId}/expense-categories/${id}`,
        method: "DELETE",
        body: undefined,
        queryKeysToInvalidate: [[...expenseKeys.all(orgId ?? "")]],
      });
    },
    onMutate: async (id) => {
      const key = expenseKeys.categories(orgId ?? "");
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ExpenseCategory[]>(key);
      if (previous) {
        queryClient.setQueryData<ExpenseCategory[]>(
          key,
          previous.filter((c) => c.id !== id),
        );
      }
      return { previous };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previous)
        queryClient.setQueryData<ExpenseCategory[]>(
          expenseKeys.categories(orgId ?? ""),
          context.previous,
        );
      toastRetry(err.message ?? "Failed to delete category", () =>
        mutation.mutateAsync(variables),
      );
    },
    onSuccess: (data) => {
      const d = data as unknown as Record<string, unknown> | undefined;
      if (d?.queued) {
        toast.info("Saved offline — will sync when connected");
      } else {
        toast.dismiss();
        toast.success("Category deleted");
      }
    },
    onSettled: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: expenseKeys.categories(orgId),
        });
    },
  });
  return mutation;
}
