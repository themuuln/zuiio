import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createWorkOrder,
  getWorkOrders,
} from "@/lib/services/work-order-service";
import type { WorkOrderStatus } from "@/lib/types";
import { createWorkOrderSchema, parseBody } from "@/lib/validation/work-orders";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const statuses = searchParams.getAll("status");
    const filters = {
      status:
        statuses.length > 0
          ? (statuses as unknown as WorkOrderStatus[])
          : undefined,
      mechanic_id: searchParams.get("mechanic") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      search: searchParams.get("q") ?? undefined,
      branchId: searchParams.get("branch_id") ?? undefined,
    };

    const workOrders = await getWorkOrders(supabase, orgId, filters);
    return NextResponse.json({ data: workOrders });
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await parseBody(request, createWorkOrderSchema);
    const workOrder = await createWorkOrder(supabase, orgId, body);
    return NextResponse.json({ data: workOrder }, { status: 201 });
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
