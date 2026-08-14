import { z } from "zod";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { saveSubscription } from "@/lib/services/push-service";

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/**
 * POST /api/push/subscribe
 * Save a push subscription for the current user.
 */
export const POST = createSimpleRouteHandler(
  async ({ request, supabase, user }) => {
    const body = SubscribeBody.parse(await request.json());

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return ok({ success: false, reason: "no_organization" });
    }

    await saveSubscription(supabase, {
      userId: user.id,
      organizationId: profile.organization_id,
      subscription: {
        endpoint: body.endpoint,
        keys: body.keys,
      },
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return ok({ success: true });
  },
);
