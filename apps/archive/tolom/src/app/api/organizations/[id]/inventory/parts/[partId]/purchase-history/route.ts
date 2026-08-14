import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";

export const GET = createRouteHandler(async ({ params, supabase, orgId }) => {
  const { partId } = params;

  const { data, error } = await supabase
    .from("purchase_order_items")
    .select(
      "id, quantity_ordered, quantity_received, unit_cost, purchase_order:purchase_orders!inner(id, created_at, status, supplier:suppliers!inner(id, name))",
    )
    .eq("part_id", partId)
    .eq("organization_id", orgId)
    .order("created_at", {
      referencedTable: "purchase_orders",
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return ok(data ?? []);
});
