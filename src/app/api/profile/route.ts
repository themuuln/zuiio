import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { getCurrentUserProfile } from "@/lib/services/user-service";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const profile = await getCurrentUserProfile(supabase);
  return NextResponse.json(profile);
});
