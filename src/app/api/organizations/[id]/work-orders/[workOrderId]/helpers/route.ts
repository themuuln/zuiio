import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
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
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "mechanic_id is required",
          },
        },
        { status: 400 },
      );
    }
    await assignHelperToWorkOrder(supabase, orgId, workOrderId, mechanicId, user.id);
    return NextResponse.json({ data: null }, { status: 201 });
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
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "mechanicId query param required",
          },
        },
        { status: 400 },
      );
    }
    await removeHelperFromWorkOrder(supabase, orgId, workOrderId, mechanicId);
    return NextResponse.json({ data: null });
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
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "mechanic_ids array is required",
          },
        },
        { status: 400 },
      );
    }
    await reorderWorkOrderHelpers(supabase, orgId, workOrderId, mechanic_ids);
    return NextResponse.json({ data: null });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);
