import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getPartsCarParts,
  addPartsCarPart,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const parts = await getPartsCarParts(orgId, params.carId);
  return NextResponse.json({ data: parts });
});

export const POST = createRouteHandler(async ({ request, orgId, user, params }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const part = await addPartsCarPart(orgId, user.id, params.carId, body);
  return NextResponse.json({ data: part }, { status: 201 });
});
