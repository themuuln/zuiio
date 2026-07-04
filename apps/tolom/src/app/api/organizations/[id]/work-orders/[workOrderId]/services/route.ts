import { ok, created, apiError, createRouteHandler } from "@/lib/api-response"
import {
  addServiceToWorkOrder,
  removeServiceFromWorkOrder,
  updateWorkOrderServicePrice,
} from "@/lib/services/work-order-items-service";
import {
  addWorkOrderServiceSchema,
  parseBody,
  updateServicePriceSchema,
} from "@/lib/validation/work-orders";

export const POST = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const body = await parseBody(request, addWorkOrderServiceSchema);
    const service = await addServiceToWorkOrder(
      supabase,
      workOrderId,
      orgId,
      body,
    );
    return created(service);
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
    const serviceId = searchParams.get("serviceId");
    const body = await parseBody(request, updateServicePriceSchema);
    if (!serviceId) {
      return apiError("VALIDATION_ERROR", "serviceId query param required", 400);
    }

    const updateParams: { final_price?: number; quantity?: number } = {};
    if (body.final_price !== undefined)
      updateParams.final_price = body.final_price;
    if (body.quantity !== undefined) updateParams.quantity = body.quantity;

    if (Object.keys(updateParams).length > 0) {
      await updateWorkOrderServicePrice(
        supabase,
        serviceId,
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
    const serviceId = searchParams.get("serviceId");
    if (!serviceId) {
      return apiError("VALIDATION_ERROR", "serviceId query param required", 400);
    }

    await removeServiceFromWorkOrder(supabase, serviceId, workOrderId, orgId);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);
