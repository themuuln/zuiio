import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { backfillSchedulesFromHistory } from "@/lib/services/service-reminder-service";
export const POST = createRouteHandler(
  async ({ request: _request, orgId, supabase, user }) => {
    const synced = await backfillSchedulesFromHistory(supabase, orgId, user.id);
    return ok({ synced });
  },
  { rateLimit: true, subscription: true },
);
