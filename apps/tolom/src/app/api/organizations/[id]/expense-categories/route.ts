import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {

  createExpenseCategory,
  getExpenseCategories as getCategories,
  seedDefaultExpenseCategories,
} from "@/lib/services/expense-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ orgId, user, supabase }) => {
    await seedDefaultExpenseCategories(supabase, orgId, user.id);
    const categories = await getCategories(supabase, orgId);
    return ok(categories);
  },
  { requiredPermission: { resource: "expense_categories", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const category = await createExpenseCategory(
      supabase,
      orgId,
      body,
      user.id,
    );
    return created(category);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "expense_categories", action: "create" },
  },
);
