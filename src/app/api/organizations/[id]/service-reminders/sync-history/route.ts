import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { backfillSchedulesFromHistory } from "@/lib/services/service-reminder-service";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const synced = await backfillSchedulesFromHistory(supabase, orgId);
    return NextResponse.json({ data: { synced } });
  },
  { rateLimit: true, subscription: true },
);
