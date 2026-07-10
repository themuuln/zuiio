import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { backfillSchedulesFromHistory } from "@/lib/services/service-reminder-service";

export const POST = createRouteHandler(
  async ({ request: _request, orgId, supabase }) => {
    const synced = await backfillSchedulesFromHistory(supabase, orgId);
    return ok({ synced });
  },
  { rateLimit: true, subscription: true },
);
