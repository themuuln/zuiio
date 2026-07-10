import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { clockOut } from "@/lib/services/time-tracking-service";
export const POST = createRouteHandler(
  async ({ request: _request, orgId, user, supabase }) => {
    const log = await clockOut(supabase, orgId, user.id);
    return ok(log);
  },
  { rateLimit: true },
);
