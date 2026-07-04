import { createRouteHandler } from "@/lib/api-handler";
import { backfillSchedulesFromHistory } from "@/lib/services/service-reminder-service";
import { ok } from "@/lib/api-response";

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const synced = await backfillSchedulesFromHistory(supabase, orgId);
    return ok({ synced });
  },
  { rateLimit: true, subscription: true },
);
