import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteService,
  getService,
  updateService,
} from "@/lib/services/service-catalog-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ params }) => {
  const { serviceId } = params;
  const service = await getService(serviceId);
  return NextResponse.json({ data: service });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { serviceId } = params;
  const body = await request.json();
  const service = await updateService(serviceId, orgId, body);
  return NextResponse.json({ data: service });
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { serviceId } = params;
  await deleteService(serviceId, orgId);
  return NextResponse.json({ data: null });
});
