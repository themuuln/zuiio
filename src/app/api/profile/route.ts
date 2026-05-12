import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { getCurrentUserProfile } from "@/lib/services/user-service";

export const GET = createSimpleRouteHandler(async () => {
  const profile = await getCurrentUserProfile();
  return NextResponse.json(profile);
});
