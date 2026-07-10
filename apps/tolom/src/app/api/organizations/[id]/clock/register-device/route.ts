import { apiError, created, createRouteHandler } from "@/lib/api-response";
import { registerDevice } from "@/lib/services/qr-token-service";
export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = (await request.json()) as {
      registrationToken: string;
      deviceFingerprint: string;
      deviceName?: string;
    };
    if (!body.registrationToken || !body.deviceFingerprint) {
      return apiError(
        "BAD_REQUEST",
        "registrationToken and deviceFingerprint are required",
        400,
      );
    }

    const device = await registerDevice(
      supabase,
      orgId,
      body.registrationToken,
      body.deviceFingerprint,
      body.deviceName,
    );
    return created({ deviceId: device.deviceId });
  },
  { rateLimit: true },
);
