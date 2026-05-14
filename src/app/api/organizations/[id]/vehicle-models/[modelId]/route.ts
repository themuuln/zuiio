import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  deleteVehicleModel,
  updateVehicleModel,
} from "@/lib/services/vehicle-models-service";

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { modelId } = params;
  const body = await request.json();
  const model = await updateVehicleModel(modelId, orgId, body);
  return NextResponse.json({ data: model });
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { modelId } = params;
  await deleteVehicleModel(modelId, orgId);
  return NextResponse.json({ data: null });
});
