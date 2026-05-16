import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { sendPendingReminders } from "@/lib/services/service-reminder-service";

export const POST = createRouteHandler(async ({ orgId }) => {
  await requireActiveSubscription(orgId);
  const sent = await sendPendingReminders(orgId);
  return NextResponse.json({ data: { sent } });
});
