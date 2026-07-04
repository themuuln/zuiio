import { createRouteHandler } from "@/lib/api-handler";
import { ok, created } from "@/lib/api-response";
import { createSupplier, getSuppliers } from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const suppliers = await getSuppliers(supabase, orgId);
  return ok(suppliers);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const supplier = await createSupplier(supabase, orgId, body, user.id);
    return created(supplier);
  },
  { rateLimit: true, subscription: true },
);
