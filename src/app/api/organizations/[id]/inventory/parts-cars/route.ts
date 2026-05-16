import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getPartsCars,
  createPartsCar,
} from "@/lib/services/parts-cars-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const cars = await getPartsCars(orgId);
  return NextResponse.json({ data: cars });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const car = await createPartsCar(orgId, user.id, body);
  return NextResponse.json({ data: car }, { status: 201 });
});
