import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  addCountItem,
  removeCountItem,
} from "@/lib/services/stock-count-service";

export const POST = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { sessionId } = params;
    const body = await request.json();
    const item = await addCountItem(
      supabase,
      orgId,
      sessionId,
      body.part_id,
      body.physical_quantity,
      body.notes ?? null,
    );
    return created(item);
  },
  {
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return apiError("VALIDATION", "Missing itemId", 400);
    const result = await removeCountItem(supabase, orgId, itemId);
    return ok(result);
  },
  {
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
