import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { checkSubscriptionStatus } from "@/lib/services/subscription-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const status = await checkSubscriptionStatus(orgId);
  return NextResponse.json({ data: status });
});
