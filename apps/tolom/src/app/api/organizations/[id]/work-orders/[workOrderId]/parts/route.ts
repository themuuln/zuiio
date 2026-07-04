import { ok, created, apiError, createRouteHandler } from "@/lib/api-response"
import {
  addPartToWorkOrder,
  removePartFromWorkOrder,
  updateWorkOrderPartPrice,
} from "@/lib/services/work-order-items-service";
import {
  addWorkOrderPartSchema,
  parseBody,
  updatePartPriceSchema,
} from "@/lib/validation/work-orders";

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const body = await parseBody(request, addWorkOrderPartSchema);
    const part = await addPartToWorkOrder(supabase, workOrderId, orgId, body);
    return created(part);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const { searchParams } = new URL(request.url);
    const partId = searchParams.get("partId");
    const body = await parseBody(request, updatePartPriceSchema);
    if (!partId) {
      return apiError("VALIDATION_ERROR", "partId query param required", 400);
    }

    const updateParams: { final_price?: number; quantity?: number } = {};
    if (body.final_price !== undefined)
      updateParams.final_price = body.final_price;
    if (body.quantity !== undefined) updateParams.quantity = body.quantity;

    if (Object.keys(updateParams).length > 0) {
      await updateWorkOrderPartPrice(
        supabase,
        partId,
        workOrderId,
        updateParams,
        orgId,
      );
    }

    return ok(null);
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
    const partId = searchParams.get("partId");
    if (!partId) {
      return apiError("VALIDATION_ERROR", "partId query param required", 400);
    }

    await removePartFromWorkOrder(supabase, partId, workOrderId, orgId);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);
