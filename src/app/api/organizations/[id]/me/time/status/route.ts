import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { getClockStatus } from "@/lib/services/time-tracking-service";

export const GET = createRouteHandler(async ({ orgId, user, supabase }) => {
  const status = await getClockStatus(supabase, orgId, user.id);
  return NextResponse.json({ data: status });
});
