import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getStockThresholds,
  setStockThreshold,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const thresholds = await getStockThresholds(orgId);
  return NextResponse.json({ data: thresholds });
});

export const POST = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const threshold = await setStockThreshold(orgId, body);
  return NextResponse.json({ data: threshold }, { status: 201 });
});
