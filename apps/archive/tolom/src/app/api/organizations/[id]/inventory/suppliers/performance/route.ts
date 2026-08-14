import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getSupplierPerformance } from "@/lib/services/supplier-service";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const performance = await getSupplierPerformance(supabase, orgId);
    return ok(performance);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);
