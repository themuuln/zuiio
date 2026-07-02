import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  getRegisteredDevices,
  revokeDevice,
} from "@/lib/services/qr-token-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const mechanicId =
    request.nextUrl.searchParams.get("mechanicId") ?? undefined;
  const devices = await getRegisteredDevices(supabase, orgId, mechanicId);
  return NextResponse.json({ data: devices });
});

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = (await request.json()) as { deviceId: string };
    if (!body.deviceId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "deviceId is required" } },
        { status: 400 },
      );
    }

    await revokeDevice(supabase, body.deviceId);
    return NextResponse.json({ data: { success: true } });
  },
  { rateLimit: true },
);
