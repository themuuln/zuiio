import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getPartSuppliers } from "@/lib/services/supplier-service";

export const GET = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { partId } = params;
    const suppliers = await getPartSuppliers(supabase, orgId, partId);
    return ok(suppliers);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);
