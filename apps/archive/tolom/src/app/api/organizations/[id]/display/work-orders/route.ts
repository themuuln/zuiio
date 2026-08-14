import { createRouteHandler, ok } from "@/lib/api-response";

export interface DisplayWorkOrder {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  status_changed_at: string | null;
  customer_name: string | null;
  plate_number: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  mechanic_name: string | null;
  services: { name: string }[];
  complaint: string | null;
}

// Type for the raw PostgREST join response
interface WorkOrderRow {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  updated_at: string;
  complaint: string | null;
  customer: { first_name: string | null; last_name: string | null } | null;
  vehicle: {
    plate_number: string | null;
    make: string | null;
    model: string | null;
  } | null;
  mechanic: { full_name: string | null } | null;
  work_order_services: { service_name: string }[];
}

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    // Fetch active work orders (not completed/cancelled) with service names
    const { data: wos, error: woError } = await supabase
      .from("work_orders")
      .select(
        `
        id, status, created_at, started_at, updated_at,
        complaint,
        customer:customer_id ( first_name, last_name ),
        vehicle:vehicle_id ( plate_number, make, model ),
        mechanic:mechanic_id ( full_name ),
        work_order_services ( service_name )
      `,
      )
      .eq("organization_id", orgId)
      .not("status", "in", '("Completed","Cancelled")')
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (woError) {
      throw new Error(woError.message);
    }

    const rows = (wos ?? []) as unknown as WorkOrderRow[];

    const data: DisplayWorkOrder[] = rows.map((wo) => ({
      id: wo.id,
      status: wo.status,
      created_at: wo.created_at,
      started_at: wo.started_at,
      status_changed_at: wo.updated_at,
      customer_name: wo.customer
        ? [wo.customer.first_name, wo.customer.last_name]
            .filter(Boolean)
            .join(" ")
        : null,
      plate_number: wo.vehicle?.plate_number ?? null,
      vehicle_make: wo.vehicle?.make ?? null,
      vehicle_model: wo.vehicle?.model ?? null,
      mechanic_name: wo.mechanic?.full_name ?? null,
      complaint: wo.complaint ?? null,
      services: (wo.work_order_services ?? []).map((s) => ({
        name: s.service_name,
      })),
    }));

    return ok(data);
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);
