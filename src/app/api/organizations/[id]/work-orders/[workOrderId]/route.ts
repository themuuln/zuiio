import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  assignMechanic,
  cancelWorkOrder,
  getWorkOrder,
  updateWorkOrderStatus,
} from "@/lib/services/work-order-service";

export const GET = createRouteHandler(async ({ params, orgId }) => {
  const { workOrderId } = params;
  const wo = await getWorkOrder(workOrderId);
  return NextResponse.json({ data: wo });
});

export const PATCH = createRouteHandler(async ({ request, params, orgId }) => {
  const { workOrderId } = params;
  const body = await request.json();

  // Handle status change
  if (body.status) {
    const wo = await updateWorkOrderStatus(
      workOrderId,
      orgId,
      body.status,
      body.notes,
    );
    return NextResponse.json({ data: wo });
  }

  // Handle mechanic assignment
  if (body.mechanic_id) {
    const assignment = await assignMechanic(
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
});

export const DELETE = createRouteHandler(async ({ params, orgId }) => {
  const { workOrderId } = params;
  await cancelWorkOrder(workOrderId, orgId);
  return NextResponse.json({ data: null });
});
