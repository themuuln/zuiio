import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  addPartToWorkOrder,
  removePartFromWorkOrder,
} from "@/lib/services/work-order-service";

export const POST = createRouteHandler(async ({ request, params, orgId }) => {
  const { workOrderId } = params;
  const body = await request.json();
  const part = await addPartToWorkOrder(workOrderId, orgId, body);
  return NextResponse.json({ data: part }, { status: 201 });
});

export const DELETE = createRouteHandler(async ({ request, params }) => {
  const { workOrderId } = params;
  const { searchParams } = new URL(request.url);
  const partId = searchParams.get("partId");

  if (!partId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "partId query param required",
        },
      },
      { status: 400 },
    );
  }

  await removePartFromWorkOrder(partId, workOrderId);
  return NextResponse.json({ data: null });
});
