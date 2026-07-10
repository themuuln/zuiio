import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import {

  deleteExpense,
  getExpense,
  updateExpense,
} from "@/lib/services/expense-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { expenseId } = params;
    const expense = await getExpense(supabase, expenseId, orgId);
    return ok(expense);
  },
  { requiredPermission: { resource: "expenses", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { expenseId } = params;
    const body = await request.json();
    const expense = await updateExpense(
      supabase,
      expenseId,
      orgId,
      body,
      user.id,
    );
    return ok(expense);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expenses", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ orgId, params, user, supabase }) => {
    const { expenseId } = params;
    await deleteExpense(supabase, expenseId, orgId, user.id);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expenses", action: "delete" },
  },
);
