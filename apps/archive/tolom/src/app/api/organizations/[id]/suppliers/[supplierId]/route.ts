import { createRouteHandler } from "@/lib/api-handler";
import { noContent, ok } from "@/lib/api-response";
import {
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from "@/lib/services/inventory-service";
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { supplierId } = params;
  const supplier = await getSupplier(supabase, supplierId, orgId);
  return ok(supplier);
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { supplierId } = params;
    const body = await request.json();
    const supplier = await updateSupplier(supabase, supplierId, orgId, body);
    return ok(supplier);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { supplierId } = params;
    await deleteSupplier(supabase, supplierId, orgId);
    return noContent();
  },
  { rateLimit: true, subscription: true },
);
