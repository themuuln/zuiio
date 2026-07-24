import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import {

  getRegisteredDevices,
  revokeDevice,
} from "@/lib/services/qr-token-service";
export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const mechanicId =
    request.nextUrl.searchParams.get("mechanicId") ?? undefined;
  const devices = await getRegisteredDevices(supabase, orgId, mechanicId);
  return ok(devices);
});

export const DELETE = createRouteHandler(
  async ({ request, supabase }) => {
    const body = (await request.json()) as { deviceId: string };
    if (!body.deviceId) {
      return apiError("BAD_REQUEST", "deviceId is required", 400);
    }

    await revokeDevice(supabase, body.deviceId);
    return ok({ success: true });
  },
  { rateLimit: true },
);
