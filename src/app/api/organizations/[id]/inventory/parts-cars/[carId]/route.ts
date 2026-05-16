import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getPartsCar,
  updatePartsCar,
  deletePartsCar,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const car = await getPartsCar(orgId, params.carId);
  return NextResponse.json({ data: car });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const car = await updatePartsCar(orgId, params.carId, body);
  return NextResponse.json({ data: car });
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  await requireActiveSubscription(orgId);
  await deletePartsCar(orgId, params.carId);
  return NextResponse.json({ data: null }, { status: 204 });
});
