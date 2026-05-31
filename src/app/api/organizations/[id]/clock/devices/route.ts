import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getRegisteredDevices,
  revokeDevice,
} from "@/lib/services/qr-token-service";

export const GET = createRouteHandler(async ({ request, orgId }) => {
  const mechanicId =
    request.nextUrl.searchParams.get("mechanicId") ?? undefined;
  const devices = await getRegisteredDevices(orgId, mechanicId);
  return NextResponse.json({ data: devices });
});

export const DELETE = createRouteHandler(async ({ request, orgId }) => {
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

  const body = (await request.json()) as { deviceId: string };
  if (!body.deviceId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "deviceId is required" } },
      { status: 400 },
    );
  }

  await revokeDevice(body.deviceId);
  return NextResponse.json({ data: { success: true } });
});
