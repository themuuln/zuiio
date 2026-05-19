import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { getInviteByToken } from "@/lib/services/invite-service";

export const GET = createSimpleRouteHandler(async ({ request }) => {
  const token = request.nextUrl.pathname.split("/").pop() ?? "";
  const invite = await getInviteByToken(token);
  return NextResponse.json({ data: invite });
});
