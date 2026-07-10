import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { sendPendingReminders } from "@/lib/services/service-reminder-service";

export const POST = createRouteHandler(
  async ({ request: _request, orgId, supabase }) => {
    const sent = await sendPendingReminders(supabase, orgId);
    return ok({ sent });
  },
  { rateLimit: true, subscription: true },
);
