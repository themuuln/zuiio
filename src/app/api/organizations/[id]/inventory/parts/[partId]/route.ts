import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  deletePart,
  getPart,
  updatePart,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { partId } = params;
  const part = await getPart(partId);
  return NextResponse.json({ data: part });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { partId } = params;
  const body = await request.json();
  const part = await updatePart(partId, orgId, body);
  return NextResponse.json({ data: part });
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { partId } = params;
  await deletePart(partId, orgId);
  return NextResponse.json({ data: null });
});
