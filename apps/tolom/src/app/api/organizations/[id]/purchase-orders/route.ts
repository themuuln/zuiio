import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {
  createPurchaseOrder,
  getPurchaseOrders,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const orders = await getPurchaseOrders(supabase, orgId);
  return ok(orders);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const order = await createPurchaseOrder(supabase, orgId, body, user.id);
    return created(order);
  },
  { rateLimit: true, subscription: true },
);
