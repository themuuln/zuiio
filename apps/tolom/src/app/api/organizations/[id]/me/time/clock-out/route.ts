import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { clockOut } from "@/lib/services/time-tracking-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const log = await clockOut(supabase, orgId, user.id);
    return NextResponse.json({ data: log });
  },
  { rateLimit: true },
);
