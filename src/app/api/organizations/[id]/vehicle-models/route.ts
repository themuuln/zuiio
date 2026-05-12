import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { createVehicleModel, getVehicleModels } from "@/lib/services/vehicle-models-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const models = await getVehicleModels(orgId);
  return NextResponse.json({ data: models });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  const body = await request.json();
  const model = await createVehicleModel(orgId, body);
  return NextResponse.json({ data: model }, { status: 201 });
});
