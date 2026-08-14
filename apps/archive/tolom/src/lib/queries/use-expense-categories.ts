import type { ExpenseCategory } from "@/lib/types";
import { expenseKeys } from "./keys";
import { createCrudHooks } from "./use-crud-list";

// ── CRUD hooks via factory ──────────────────────────────────────

const crud = createCrudHooks<ExpenseCategory>({
  path: "/expense-categories",
  queryKey: (orgId) => expenseKeys.categories(orgId),
  optimisticCreate: (body, orgId, { optimisticId }) => ({
    id: optimisticId,
    organization_id: orgId,
    name: body.name ?? "",
    description: body.description ?? null,
    color: body.color ?? "",
    icon: body.icon ?? "",
    sort_order: body.sort_order ?? 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
});

export const {
  useList: useExpenseCategories,
  useCreate: useCreateExpenseCategory,
  useUpdate: useUpdateExpenseCategory,
  useDelete: useDeleteExpenseCategory,
} = crud;
