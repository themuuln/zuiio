import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { backfillSchedulesFromHistory } from "@/lib/services/service-reminder-service";

export const POST = createRouteHandler(async ({ orgId }) => {
  await requireActiveSubscription(orgId);
  const synced = await backfillSchedulesFromHistory(orgId);
  return NextResponse.json({ data: { synced } });
});
