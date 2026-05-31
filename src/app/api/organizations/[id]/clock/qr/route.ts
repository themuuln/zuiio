import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { generateClockToken } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const body = (await request.json()) as {
    actionType: "clock_in" | "clock_out";
  };
  if (
    !body.actionType ||
    !["clock_in", "clock_out"].includes(body.actionType)
  ) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "actionType must be 'clock_in' or 'clock_out'",
        },
      },
      { status: 400 },
    );
  }

  const token = await generateClockToken(orgId, body.actionType);
  return NextResponse.json({ data: token }, { status: 201 });
});
