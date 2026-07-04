import { created } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { clockIn } from "@/lib/services/time-tracking-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const log = await clockIn(supabase, orgId, user.id);
    return created(log);
  },
  { rateLimit: true },
);
