import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  cancelWorkOrder,
  getWorkOrder,
} from "@/lib/services/work-order-service";
import {
  assignMechanic,
  updateWorkOrderStatus,
} from "@/lib/services/work-order-workflow";
import { parseBody, updateWorkOrderSchema } from "@/lib/validation/work-orders";

export const GET = createRouteHandler(async ({ params, orgId, supabase }) => {
  await requireActiveSubscription(orgId);
  const { workOrderId } = params;
  const wo = await getWorkOrder(supabase, workOrderId);
  return NextResponse.json({ data: wo });
});

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
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
        return NextResponse.json(
          { error: { code: "UPDATE_FAILED", message: error.message } },
          { status: 500 },
        );
      }

      const wo = await getWorkOrder(supabase, workOrderId);
      return NextResponse.json({ data: wo });
    }

    if (body.status) {
      const wo = await updateWorkOrderStatus(
        supabase,
        workOrderId,
        orgId,
        body.status,
        body.notes,
        body.loss_reason,
      );
      return NextResponse.json({ data: wo });
    }

    if (body.mechanic_id !== undefined) {
      const assignment = await assignMechanic(
        supabase,
        workOrderId,
        orgId,
        body.mechanic_id,
      );
      return NextResponse.json({ data: assignment });
    }

    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "No valid action" } },
      { status: 400 },
    );
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    const { workOrderId } = params;
    await cancelWorkOrder(supabase, workOrderId, orgId);
    return NextResponse.json({ data: null });
  },
  { requiredPermission: { resource: "work_orders", action: "delete" } },
);
