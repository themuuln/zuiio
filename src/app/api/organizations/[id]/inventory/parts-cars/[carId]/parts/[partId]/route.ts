import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { removePartsCarPart } from "@/lib/services/parts-cars-service";

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  await requireActiveSubscription(orgId);
  await removePartsCarPart(orgId, params.carId, params.partId);
  return NextResponse.json({ data: null }, { status: 204 });
});
