import { createRouteHandler } from "@/lib/api-handler";
import { created } from "@/lib/api-response";
import { clockIn } from "@/lib/services/time-tracking-service";

export { dynamic } from "@/lib/api-handler";

export const POST = createRouteHandler(
  async ({ orgId, user, supabase }) => {
    const log = await clockIn(supabase, orgId, user.id);
    return created(log);
  },
  { rateLimit: true },
);
