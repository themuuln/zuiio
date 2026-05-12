import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import type { WorkOrderStatus } from "@/lib/database.types";
import { createWorkOrder, getWorkOrders } from "@/lib/services/work-order-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const filters = {
    status: (searchParams.get("status") as WorkOrderStatus) ?? undefined,
    mechanic_id: searchParams.get("mechanic") ?? undefined,
    date: searchParams.get("date") ?? undefined,
  };

  const workOrders = await getWorkOrders(orgId, filters);
  return NextResponse.json({ data: workOrders });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  const body = await request.json();
  const workOrder = await createWorkOrder(orgId, body);
  return NextResponse.json({ data: workOrder }, { status: 201 });
});
