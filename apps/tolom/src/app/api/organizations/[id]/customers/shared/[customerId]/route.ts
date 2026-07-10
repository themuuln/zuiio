import { createRouteHandler, ok } from "@/lib/api-response";
import {
  getSharedCustomer,
  getSharedCustomerVehicles,
} from "@/lib/services/customer-service";

/**
 * GET /api/organizations/[id]/customers/shared/[customerId]
 * Returns a read-only view of a customer from a sharing-enabled org.
 */
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { customerId } = params;
  const [customer, vehicles] = await Promise.all([
    getSharedCustomer(supabase, customerId, orgId),
    getSharedCustomerVehicles(supabase, customerId, orgId),
  ]);
  return ok({ ...customer, vehicles });
});
