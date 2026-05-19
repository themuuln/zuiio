import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(
  async ({ customer, supabase }) => {
    const vehicleIds = (
      await supabase
        .from("vehicle_owners")
        .select("vehicle_id")
        .eq("customer_id", customer.id)
        .is("owned_until", null)
    ).data?.map((v) => v.vehicle_id) ?? [];

    if (vehicleIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const workOrderIds = (
      await supabase
        .from("work_orders")
        .select("id")
        .in("vehicle_id", vehicleIds)
        .is("deleted_at", null)
    ).data?.map((wo) => wo.id) ?? [];

    if (workOrderIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*")
      .in("work_order_id", workOrderIds)
      .is("deleted_at", null)
      .order("issued_at", { ascending: false });

    if (invoicesError) throw invoicesError;

    let invoicesWithItems: Record<string, unknown>[] = [];

    if (invoices.length > 0) {
      const invoiceIds = invoices.map((inv) => inv.id);
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .in("invoice_id", invoiceIds);

      if (itemsError) throw itemsError;

      invoicesWithItems = invoices.map((inv) => ({
        ...inv,
        items: items?.filter((item) => item.invoice_id === inv.id) ?? [],
      }));
    }

    return NextResponse.json({ data: invoicesWithItems });
  },
);
