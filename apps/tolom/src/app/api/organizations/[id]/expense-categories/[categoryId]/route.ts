import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteExpenseCategory,
  updateExpenseCategory,
} from "@/lib/services/expense-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { categoryId } = params;
    const body = await request.json();
    const category = await updateExpenseCategory(
      supabase,
      categoryId,
      orgId,
      body,
      user.id,
    );
    return ok(category);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expense_categories", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { categoryId } = params;
    await deleteExpenseCategory(supabase, categoryId, orgId, user.id);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expense_categories", action: "delete" },
  },
);
