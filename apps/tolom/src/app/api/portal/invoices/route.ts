import { ok } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(async ({ customer, supabase }) => {
  const vehicleIds =
    (
      await supabase
        .from("vehicle_owners")
        .select("vehicle_id")
        .eq("customer_id", customer.id)
        .is("owned_until", null)
    ).data?.map((v) => v.vehicle_id) ?? [];

  if (vehicleIds.length === 0) {
    return ok([]);
  }

  const workOrderIds =
    (
      await supabase
        .from("work_orders")
        .select("id")
        .in("vehicle_id", vehicleIds)
        .is("deleted_at", null)
    ).data?.map((wo) => wo.id) ?? [];

  if (workOrderIds.length === 0) {
    return ok([]);
  }

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select(
      "id, organization_id, invoice_number, status, subtotal, total, amount_paid, balance_due, issued_at, due_at, paid_at, work_order_id, customer_name, vehicle_plate, public_token, created_at",
    )
    .in("work_order_id", workOrderIds)
    .is("deleted_at", null)
    .order("issued_at", { ascending: false });

  if (invoicesError) throw invoicesError;

  let invoicesWithItems: Record<string, unknown>[] = [];

  if (invoices.length > 0) {
    const invoiceIds = invoices.map((inv) => inv.id);
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select(
        "id, invoice_id, item_type, description, quantity, unit_price, discount_amount, total_price, sort_order",
      )
      .in("invoice_id", invoiceIds);

    if (itemsError) throw itemsError;

    invoicesWithItems = invoices.map((inv) => ({
      ...inv,
      items: items?.filter((item) => item.invoice_id === inv.id) ?? [],
    }));
  }

  return ok(invoicesWithItems);
});
