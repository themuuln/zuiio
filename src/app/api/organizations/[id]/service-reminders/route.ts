import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  createServiceSchedule,
  getServiceSchedules,
} from "@/lib/services/service-reminder-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicle_id") ?? undefined;
  const schedules = await getServiceSchedules(orgId, vehicleId);
  return NextResponse.json({ data: schedules });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const body = await request.json();
  const schedule = await createServiceSchedule(orgId, user.id, body);
  return NextResponse.json({ data: schedule }, { status: 201 });
});
