import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { registerDevice } from "@/lib/services/qr-token-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = (await request.json()) as {
      registrationToken: string;
      deviceFingerprint: string;
      deviceName?: string;
    };
    if (!body.registrationToken || !body.deviceFingerprint) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "registrationToken and deviceFingerprint are required",
          },
        },
        { status: 400 },
      );
    }

    const device = await registerDevice(
      supabase,
      orgId,
      body.registrationToken,
      body.deviceFingerprint,
      body.deviceName,
    );
    return NextResponse.json(
      { data: { deviceId: device.deviceId } },
      { status: 201 },
    );
  },
  { rateLimit: true },
);
