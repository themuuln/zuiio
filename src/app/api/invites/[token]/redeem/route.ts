import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { authRateLimiter } from "@/lib/rate-limit";
import { redeemInvite } from "@/lib/services/invite-service";

export const POST = createSimpleRouteHandler(async ({ request, user }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = authRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const token = request.nextUrl.pathname.split("/").at(-2) ?? "";
  const result = await redeemInvite(token, user.id);
  return NextResponse.json({ data: result });
});
