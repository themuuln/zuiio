import { createRouteHandler, ok } from "@/lib/api-response";
import { deleteCustomerNote } from "@/lib/services/customer-note-service";

export { dynamic } from "@/lib/api-handler";

export const DELETE = createRouteHandler(
  async ({ orgId, params, user, supabase }) => {
    const { customerId, noteId } = params;
    await deleteCustomerNote(supabase, orgId, customerId, noteId, user.id);
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
