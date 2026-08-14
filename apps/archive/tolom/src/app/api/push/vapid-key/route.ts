import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getVapidPublicKey } from "@/lib/web-push";

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for the client to use in PushSubscription.
 */
export const GET = createSimpleRouteHandler(async () => {
  return ok({ publicKey: getVapidPublicKey() });
});
