import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";
import { NotFoundError } from "@/lib/errors";

export const GET = createPortalRouteHandler(
  async ({ customer, supabase, params }) => {
    const workOrderId = params.id;

    const { data: workOrder, error: woError } = await supabase
      .from("work_orders")
      .select("*")
      .eq("id", workOrderId)
      .is("deleted_at", null)
      .single();

    if (woError || !workOrder) throw new NotFoundError("Work order not found");

    const vehicleIds = (
      await supabase
        .from("vehicle_owners")
        .select("vehicle_id")
        .eq("customer_id", customer.id)
        .is("owned_until", null)
    ).data?.map((v) => v.vehicle_id) ?? [];

    if (!workOrder.vehicle_id || !vehicleIds.includes(workOrder.vehicle_id)) {
      throw new NotFoundError("Work order not found");
    }

    const [servicesResult, partsResult, statusHistoryResult, invoicesResult] =
      await Promise.all([
        supabase
          .from("work_order_services")
          .select("*")
          .eq("work_order_id", workOrderId),
        supabase
          .from("work_order_parts")
          .select("*")
          .eq("work_order_id", workOrderId),
        supabase
          .from("work_order_status_history")
          .select("*")
          .eq("work_order_id", workOrderId)
          .order("created_at", { ascending: true }),
        supabase
          .from("invoices")
          .select("*")
          .eq("work_order_id", workOrderId)
          .is("deleted_at", null),
      ]);

    if (servicesResult.error) throw servicesResult.error;
    if (partsResult.error) throw partsResult.error;
    if (statusHistoryResult.error) throw statusHistoryResult.error;
    if (invoicesResult.error) throw invoicesResult.error;

    let invoiceWithItems: Record<string, unknown>[] = [];
    if (invoicesResult.data.length > 0) {
      const invoiceIds = invoicesResult.data.map((inv) => inv.id);
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .in("invoice_id", invoiceIds);

      if (itemsError) throw itemsError;

      invoiceWithItems = invoicesResult.data.map((inv) => ({
        ...inv,
        items: items?.filter((item) => item.invoice_id === inv.id) ?? [],
      }));
    }

    return NextResponse.json({
      data: {
        ...workOrder,
        services: servicesResult.data ?? [],
        parts: partsResult.data ?? [],
        status_history: statusHistoryResult.data ?? [],
        invoices: invoiceWithItems,
      },
    });
  },
);
