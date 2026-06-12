import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { generateRegistrationToken } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(async ({ request, orgId, supabase }) => {
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

  const body = (await request.json()) as { mechanicId: string };
  if (!body.mechanicId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "mechanicId is required" } },
      { status: 400 },
    );
  }

  const token = await generateRegistrationToken(
    supabase,
    orgId,
    body.mechanicId,
  );
  return NextResponse.json({ data: token }, { status: 201 });
});
