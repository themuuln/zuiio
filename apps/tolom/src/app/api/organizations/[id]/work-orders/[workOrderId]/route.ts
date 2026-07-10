import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import {
  cancelWorkOrder,
  getWorkOrder,
} from "@/lib/services/work-order-service";
import {
  assignMechanic,
  updateWorkOrderStatus,
} from "@/lib/services/work-order-workflow";
import { parseBody, updateWorkOrderSchema } from "@/lib/validation/work-orders";

export const GET = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const { workOrderId } = params;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        workOrderId,
      )
    ) {
      return apiError("VALIDATION_ERROR", "Invalid work order ID", 400);
    }
    const wo = await getWorkOrder(supabase, workOrderId, orgId);
    return ok(wo);
  },
  { subscription: true },
);

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const { workOrderId } = params;
    const body = await parseBody(request, updateWorkOrderSchema);

    // Field updates (complaint, diagnosis, notes) — no status transition needed
    const hasFieldUpdate =
      body.complaint !== undefined ||
      body.diagnosis !== undefined ||
      body.notes !== undefined;

    if (hasFieldUpdate) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const updates: Record<string, unknown> = { updated_by: userId };
      if (body.complaint !== undefined) updates.complaint = body.complaint;
      if (body.diagnosis !== undefined) updates.diagnosis = body.diagnosis;
      if (body.notes !== undefined) updates.notes = body.notes;

      const { error } = await supabase
        .from("work_orders")
        .update(updates)
        .eq("id", workOrderId)
        .eq("organization_id", orgId);

      if (error) {
        return apiError("UPDATE_FAILED", error.message, 500);
      }

      const wo = await getWorkOrder(supabase, workOrderId, orgId);
      return ok(wo);
    }

    if (body.status) {
      const wo = await updateWorkOrderStatus(
        supabase,
        workOrderId,
        orgId,
        body.status,
        body.notes ?? undefined,
        body.loss_reason ?? undefined,
      );
      return ok(wo);
    }

    if (body.mechanic_id !== undefined) {
      const assignment = await assignMechanic(
        supabase,
        workOrderId,
        orgId,
        body.mechanic_id as string,
      );
      return ok(assignment);
    }

    if (body.nuat_enabled !== undefined) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from("work_orders")
        .update({
          nuat_enabled: body.nuat_enabled,
          updated_by: userId,
        })
        .eq("id", workOrderId)
        .eq("organization_id", orgId);

      if (error) {
        return apiError("UPDATE_FAILED", error.message, 500);
      }

      const wo = await getWorkOrder(supabase, workOrderId, orgId);
      return ok(wo);
    }

    if (body.customer_id !== undefined) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from("work_orders")
        .update({
          customer_id: body.customer_id,
          updated_by: userId,
        })
        .eq("id", workOrderId)
        .eq("organization_id", orgId);

      if (error) {
        return apiError("UPDATE_FAILED", error.message, 500);
      }

      const wo = await getWorkOrder(supabase, workOrderId, orgId);
      return ok(wo);
    }

    return apiError("INVALID_REQUEST", "No valid action", 400);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const { workOrderId } = params;
    await cancelWorkOrder(supabase, workOrderId, orgId);
    return ok(null);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "delete" },
  },
);
