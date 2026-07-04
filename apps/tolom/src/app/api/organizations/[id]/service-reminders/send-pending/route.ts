import { createRouteHandler } from "@/lib/api-handler";
import { sendPendingReminders } from "@/lib/services/service-reminder-service";
import { ok } from "@/lib/api-response";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const sent = await sendPendingReminders(supabase, orgId);
    return ok({ sent });
  },
  { rateLimit: true, subscription: true },
);
