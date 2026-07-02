import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteServiceSchedule,
  getServiceSchedule,
  updateServiceSchedule,
} from "@/lib/services/service-reminder-service";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { reminderId } = params;
  const schedule = await getServiceSchedule(supabase, reminderId);
  return NextResponse.json({ data: schedule });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { reminderId } = params;
    const body = await request.json();
    const schedule = await updateServiceSchedule(
      supabase,
      reminderId,
      orgId,
      user.id,
      body,
    );
    return NextResponse.json({ data: schedule });
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { reminderId } = params;
    await deleteServiceSchedule(supabase, reminderId, orgId);
    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
