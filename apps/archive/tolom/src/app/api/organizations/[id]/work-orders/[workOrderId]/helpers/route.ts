import { apiError, created, createRouteHandler, ok } from "@/lib/api-response";
import {
  assignHelperToWorkOrder,
  removeHelperFromWorkOrder,
  reorderWorkOrderHelpers,
} from "@/lib/services/bay-view-service";
export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase, user }) => {
    const { workOrderId } = params;
    const body = await request.json();
    const mechanicId = body?.mechanic_id;
    if (!mechanicId || typeof mechanicId !== "string") {
      return apiError("VALIDATION_ERROR", "mechanic_id is required", 400);
    }
    await assignHelperToWorkOrder(
      supabase,
      orgId,
      workOrderId,
      mechanicId,
      user.id,
    );
    return created(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const { searchParams } = new URL(request.url);
    const mechanicId = searchParams.get("mechanicId");
    if (!mechanicId) {
      return apiError(
        "VALIDATION_ERROR",
        "mechanicId query param required",
        400,
      );
    }
    await removeHelperFromWorkOrder(supabase, orgId, workOrderId, mechanicId);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const PUT = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const body = await request.json();
    const { mechanic_ids } = body;
    if (!Array.isArray(mechanic_ids) || mechanic_ids.length === 0) {
      return apiError(
        "VALIDATION_ERROR",
        "mechanic_ids array is required",
        400,
      );
    }
    await reorderWorkOrderHelpers(supabase, orgId, workOrderId, mechanic_ids);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);
