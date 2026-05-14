import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import {
  getOrganizationSubscription,
  renewSubscription,
  updateSubscription,
} from "@/lib/services/subscription-service";

export const GET = createRouteHandler(async ({ orgId }) => {
  const subscription = await getOrganizationSubscription(orgId);
  return NextResponse.json({ data: subscription });
});

export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  const body = await request.json();

  if (body.action === "renew") {
    const subscription = await renewSubscription(orgId);
    return NextResponse.json({ data: subscription });
  }

  if (!body.planType) {
    throw new ValidationError("planType or action is required");
  }

  const subscription = await updateSubscription(orgId, body);
  return NextResponse.json({ data: subscription });
});
