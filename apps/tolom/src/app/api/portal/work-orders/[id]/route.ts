import { NextResponse } from "next/server";
import { NotFoundError } from "@/lib/errors";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const GET = createPortalRouteHandler(
  async ({ customer, supabase, params }) => {
    const workOrderId = params.id;

    const { data: workOrder, error: woError } = await supabase
      .from("work_orders")
      .select(
        "id, organization_id, customer_id, vehicle_id, status, description, notes, bay_number, mechanic_id, complaint, diagnosis, subtotal, discount_total, total, odometer_at_service, started_at, completed_at, created_at",
      )
      .eq("id", workOrderId)
      .is("deleted_at", null)
      .single();

    if (woError || !workOrder) throw new NotFoundError("Work order not found");

    const vehicleIds =
      (
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
          .select(
            "id, work_order_id, service_name, description, unit_price, quantity, final_price, notes",
          )
          .eq("work_order_id", workOrderId),
        supabase
          .from("work_order_parts")
          .select(
            "id, work_order_id, part_name, part_number, quantity, unit_price, final_price, notes",
          )
          .eq("work_order_id", workOrderId),
        supabase
          .from("work_order_status_history")
          .select(
            "id, work_order_id, previous_status, status, notes, created_at",
          )
          .eq("work_order_id", workOrderId)
          .order("created_at", { ascending: true }),
        supabase
          .from("invoices")
          .select(
            "id, invoice_number, status, subtotal, total, amount_paid, balance_due, issued_at, due_at",
          )
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
        .select(
          "id, invoice_id, item_type, description, quantity, unit_price, total_price, sort_order",
        )
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
