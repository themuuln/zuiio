import { z } from "zod";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { removeSubscription } from "@/lib/services/push-service";

const UnsubscribeBody = z.object({
  endpoint: z.string().url(),
});

/**
 * POST /api/push/unsubscribe
 * Remove a push subscription for the current user.
 */
export const POST = createSimpleRouteHandler(
  async ({ request, supabase }) => {
    const body = UnsubscribeBody.parse(await request.json());

    await removeSubscription(supabase, body.endpoint);

    return ok({ success: true });
  },
);
