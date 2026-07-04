import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { checkSubscriptionStatus } from "@/lib/services/subscription-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const status = await checkSubscriptionStatus(supabase, orgId);
  return ok(status);
});
