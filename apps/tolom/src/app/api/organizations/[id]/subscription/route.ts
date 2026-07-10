import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import {

  createSubscription,
  getOrganizationSubscription,
  renewSubscription,
  updateSubscription,
} from "@/lib/services/subscription-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const subscription = await getOrganizationSubscription(supabase, orgId);
  return ok(subscription);
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();

    if (body.action === "start-trial") {
      const subscription = await createSubscription(supabase, orgId);
      return ok(subscription);
    }

    if (body.action === "renew") {
      const subscription = await renewSubscription(supabase, orgId);
      return ok(subscription);
    }

    if (!body.planType) {
      throw new ValidationError("planType or action is required");
    }

    const subscription = await updateSubscription(supabase, orgId, body);
    return ok(subscription);
  },
  { rateLimit: true },
);
