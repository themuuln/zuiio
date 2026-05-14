import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getOrganizationSubscription,
  updateSubscription,
} from "@/lib/services/subscription-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const subscription = await getOrganizationSubscription(orgId);
  return NextResponse.json({ data: subscription });
});

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  const body = await request.json();
  const subscription = await updateSubscription(orgId, body);
  return NextResponse.json({ data: subscription });
});
