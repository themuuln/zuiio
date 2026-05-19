import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { authRateLimiter } from "@/lib/rate-limit";
import { finalizeSignup } from "@/lib/services/signup-service";

export const POST = createSimpleRouteHandler(async ({ request, supabase }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = authRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } },
    );
  }
  const result = await finalizeSignup(supabase);
  return NextResponse.json({ data: result });
});
