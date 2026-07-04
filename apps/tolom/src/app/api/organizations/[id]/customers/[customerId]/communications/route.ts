import { ok, created, createRouteHandler } from "@/lib/api-response"
import {
  createCustomerCommunication,
  getCustomerCommunications,
} from "@/lib/services/communication-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { customerId } = params;
  const communications = await getCustomerCommunications(
    supabase,
    orgId,
    customerId,
  );
  return ok(communications);
});

export const POST = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { customerId } = params;
    const body = await request.json();
    const communication = await createCustomerCommunication(
      supabase,
      orgId,
      customerId,
      body,
      user.id,
    );
    return created(communication);
  },
  { rateLimit: true, subscription: true },
);
