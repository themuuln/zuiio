import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { completeDisassembly } from "@/lib/services/parts-cars-service";

export const POST = createRouteHandler(async ({ orgId, user, params }) => {
  await requireActiveSubscription(orgId);
  const car = await completeDisassembly(orgId, user.id, params.carId);
  return NextResponse.json({ data: car });
});
