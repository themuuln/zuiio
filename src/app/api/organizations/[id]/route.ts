import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  getOrganization,
  updateOrganization,
} from "@/lib/services/organization-service";

/**
 * GET /api/organizations/[id]
 * Returns a single organization by ID.
 */
export const GET = createRouteHandler(async ({ orgId }) => {
  const org = await getOrganization(orgId);
  return NextResponse.json({ data: org });
});

/**
 * PATCH /api/organizations/[id]
 * Updates an organization's name or settings.
 */
export const PATCH = createRouteHandler(async ({ request, orgId }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const org = await updateOrganization(orgId, body);
  return NextResponse.json({ data: org });
});
