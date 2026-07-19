import { apiError, created, createRouteHandler, ok } from "@/lib/api-response";
import {
  createPartCategory,
  getPartCategories,
} from "@/lib/services/inventory-service";
export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const categories = await getPartCategories(supabase, orgId);
    return ok(categories);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    if (!body.name?.trim()) {
      return apiError("BAD_REQUEST", "Category name is required", 400);
    }
    const category = await createPartCategory(
      supabase,
      orgId,
      body.name,
      user.id,
    );
    return created(category);
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
