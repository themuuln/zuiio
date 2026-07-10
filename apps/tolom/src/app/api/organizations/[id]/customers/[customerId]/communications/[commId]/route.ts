import { createRouteHandler, ok } from "@/lib/api-response";
import { deleteCustomerCommunication } from "@/lib/services/communication-service";

export const DELETE = createRouteHandler(
  async ({ orgId, params, user, supabase }) => {
    const { customerId, commId } = params;
    await deleteCustomerCommunication(
      supabase,
      orgId,
      customerId,
      commId,
      user.id,
    );
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
