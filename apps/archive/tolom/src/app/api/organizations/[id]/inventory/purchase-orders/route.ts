import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrder,
} from "@/lib/services/purchase-order-service";
export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
  const pos = await getPurchaseOrders(
    supabase,
    orgId,
    undefined,
    undefined,
    branchId,
  );
  return ok(pos);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const po = await createPurchaseOrder(supabase, orgId, body, user.id);
    return created(po);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase, user }) => {
    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId") ?? searchParams.get("id");
    if (!poId) {
      return apiError("VALIDATION", "poId required", 400);
    }
    const body = await request.json();
    const po = await updatePurchaseOrder(supabase, poId, orgId, body, user.id);
    return ok(po);
  },
  { rateLimit: true, subscription: true },
);
