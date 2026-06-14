import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { sendPendingReminders } from "@/lib/services/service-reminder-service";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const sent = await sendPendingReminders(supabase, orgId);
    return NextResponse.json({ data: { sent } });
  },
  { rateLimit: true, subscription: true },
);
