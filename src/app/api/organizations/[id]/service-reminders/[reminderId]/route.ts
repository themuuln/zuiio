import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  deleteServiceSchedule,
  getServiceSchedule,
  updateServiceSchedule,
} from "@/lib/services/service-reminder-service";

export const GET = createRouteHandler(async ({ params }) => {
  const { reminderId } = params;
  const schedule = await getServiceSchedule(reminderId);
  return NextResponse.json({ data: schedule });
});

export const PATCH = createRouteHandler(async ({ request, orgId, params, user }) => {
  await requireActiveSubscription(orgId);
  const { reminderId } = params;
  const body = await request.json();
  const schedule = await updateServiceSchedule(reminderId, orgId, user.id, body);
  return NextResponse.json({ data: schedule });
});

export const DELETE = createRouteHandler(async ({ orgId, params }) => {
  await requireActiveSubscription(orgId);
  const { reminderId } = params;
  await deleteServiceSchedule(reminderId, orgId);
  return NextResponse.json({ data: null });
});
