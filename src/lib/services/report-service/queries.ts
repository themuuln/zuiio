// ── Batched query helpers used by dashboard, insights, and revenue ──

import type { createClient } from "@/lib/supabase/server";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import type {
  CustomerAcquisitionPoint,
  RevenueTrendPoint,
  ServiceCategoryBreakdown,
  TechnicianPerformance,
  TopService,
  WorkOrderDetail,
} from "@/lib/types";

/**
 * Revenue trend using batched queries instead of 3 per day.
 * Fetches daily services + parts in bulk, groups in-memory.
 */
export async function getRevenueTrendBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  dayCount: number,
  branchId: string | null = null,
): Promise<RevenueTrendPoint[]> {
  const dateStrings: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dateStrings.push(d.toISOString().split("T")[0]);
  }

  const startDate = dateStrings[0];
  const endDate = dateStrings[dateStrings.length - 1];

  // 1 query: get all completed WO ids in date range
  const { data: dayWos } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id, updated_at")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("updated_at", `${startDate}T00:00:00`)
      .lte("updated_at", `${endDate}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const woMap = new Map<string, string>(); // id → date
  for (const wo of dayWos ?? []) {
    const d = (wo.updated_at ?? "").slice(0, 10);
    woMap.set(wo.id, d);
  }

  const allIds = Array.from(woMap.keys());

  // 2 queries: get all services + parts for those WOs in batch
  const [svcs, prts] = await Promise.all([
    allIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, work_order_id")
          .in("work_order_id", allIds)
      : { data: [] as any[] },
    allIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, work_order_id")
          .in("work_order_id", allIds)
      : { data: [] as any[] },
  ]);

  // Group revenue by date
  const dailyRev = new Map<string, number>();
  const dailyCount = new Map<string, number>();

  for (const s of svcs.data ?? []) {
    const d = woMap.get(s.work_order_id);
    if (d) {
      dailyRev.set(d, (dailyRev.get(d) ?? 0) + Number(s.final_price));
    }
  }
  for (const p of prts.data ?? []) {
    const d = woMap.get(p.work_order_id);
    if (d) {
      dailyRev.set(d, (dailyRev.get(d) ?? 0) + Number(p.final_price));
    }
  }

  // Count WOs per date
  for (const id of allIds) {
    const d = woMap.get(id);
    if (d) dailyCount.set(d, (dailyCount.get(d) ?? 0) + 1);
  }

  return dateStrings.map((date) => ({
    date,
    revenue: dailyRev.get(date) ?? 0,
    workOrders: dailyCount.get(date) ?? 0,
  }));
}

export async function getTopServicesBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  completedWoIds: string[],
): Promise<TopService[]> {
  if (completedWoIds.length === 0) return [];

  const { data: svcs } = await supabase
    .from("work_order_services")
    .select("service_name, final_price")
    .in("work_order_id", completedWoIds);

  const map = new Map<string, { revenue: number; count: number }>();
  for (const s of svcs ?? []) {
    const e = map.get(s.service_name) ?? { revenue: 0, count: 0 };
    e.revenue += Number(s.final_price);
    e.count++;
    map.set(s.service_name, e);
  }

  return Array.from(map.entries())
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

/** Batches mechanic data: 2 queries total regardless of mechanic count */
export async function getTechnicianPerformanceBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  allCompletedIds: string[],
  branchId: string | null = null,
): Promise<TechnicianPerformance[]> {
  // 1 query: get mechanics
  const { data: mechanics } = await supabase
    .from("organization_users")
    .select("user_id, roles!inner(name), branch_id")
    .eq("organization_id", orgId)
    .eq("roles.name", "Mechanic")
    .is("removed_at", null);

  const scopedMechanics = branchId
    ? (mechanics ?? []).filter((m) => m.branch_id === branchId)
    : (mechanics ?? []);

  if (!scopedMechanics.length) return [];
  const mechanicIds = scopedMechanics.map(
    (m: { user_id: string }) => m.user_id,
  );

  // 1 query: get profiles for all mechanics
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", mechanicIds);

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.full_name ?? "Unknown");
  }

  // 1 query: get all completed WOs grouped by mechanic
  const { data: woByMechanic } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id, mechanic_id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .in("mechanic_id", mechanicIds)
      .is("deleted_at", null),
    branchId,
  );

  // Group WO ids by mechanic
  const woPerMechanic = new Map<string, string[]>();
  for (const wo of woByMechanic ?? []) {
    const mid = wo.mechanic_id;
    if (!mid) continue;
    const list = woPerMechanic.get(mid) ?? [];
    list.push(wo.id);
    woPerMechanic.set(mid, list);
  }

  // 2 queries: get all services + parts for all completed WOs
  const [allS, allP] = await Promise.all([
    allCompletedIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, work_order_id")
          .in("work_order_id", allCompletedIds)
      : { data: [] as any[] },
    allCompletedIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, work_order_id")
          .in("work_order_id", allCompletedIds)
      : { data: [] as any[] },
  ]);

  // Build revenue lookup per WO
  const woRevenue = new Map<string, number>();
  for (const s of allS.data ?? []) {
    woRevenue.set(
      s.work_order_id,
      (woRevenue.get(s.work_order_id) ?? 0) + Number(s.final_price),
    );
  }
  for (const p of allP.data ?? []) {
    woRevenue.set(
      p.work_order_id,
      (woRevenue.get(p.work_order_id) ?? 0) + Number(p.final_price),
    );
  }

  return mechanicIds
    .map((id: string) => {
      const woIds = woPerMechanic.get(id) ?? [];
      return {
        id,
        name: nameMap.get(id) ?? "Unknown",
        completedOrders: woIds.length,
        revenue: woIds.reduce((sum, wid) => sum + (woRevenue.get(wid) ?? 0), 0),
      };
    })
    .sort(
      (a: TechnicianPerformance, b: TechnicianPerformance) =>
        b.revenue - a.revenue,
    );
}

/** Batch-fetches work order details instead of N+1 */
export async function getRecentWorkOrdersBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  woIds: string[],
): Promise<WorkOrderDetail[]> {
  if (woIds.length === 0) return [];

  const [wos, services, parts, statusHistory] = await Promise.all([
    supabase
      .from("work_orders")
      .select(
        "id, organization_id, branch_id, customer_id, vehicle_id, mechanic_id, status, complaint, diagnosis, description, notes, mechanic_notes, diagnosis_label_id, bay_number, queue_order, odometer_at_service, discount_amount, discount_percentage, discount_total, subtotal, total, completed_at, started_at, created_at, updated_at, created_by, updated_by",
      )
      .in("id", woIds)
      .is("deleted_at", null),
    supabase
      .from("work_order_services")
      .select(
        "id, work_order_id, organization_id, service_catalog_id, service_name, description, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, notes, created_at, created_by",
      )
      .in("work_order_id", woIds)
      .order("created_at"),
    supabase
      .from("work_order_parts")
      .select(
        "id, work_order_id, organization_id, part_id, part_name, part_number, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, notes, created_at, created_by",
      )
      .in("work_order_id", woIds)
      .order("created_at"),
    supabase
      .from("work_order_status_history")
      .select(
        "id, work_order_id, organization_id, status, previous_status, notes, created_by, created_at",
      )
      .in("work_order_id", woIds)
      .order("created_at", { ascending: false }),
  ]);

  // Fetch customers + vehicles in batch too
  const customerIds = [
    ...new Set(
      (wos.data ?? []).flatMap((w: { customer_id: string | null }) =>
        w.customer_id ? [w.customer_id] : [],
      ),
    ),
  ] as string[];
  const vehicleIds = [
    ...new Set(
      (wos.data ?? []).flatMap((w: { vehicle_id: string | null }) =>
        w.vehicle_id ? [w.vehicle_id] : [],
      ),
    ),
  ] as string[];

  const [customers, vehicles] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select(
            "id, organization_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, created_at",
          )
          .in("id", customerIds)
      : { data: [] as any[] },
    vehicleIds.length > 0
      ? supabase
          .from("vehicles")
          .select(
            "id, customer_id, plate_number, vin, make, model, year, color, engine, fuel_type, transmission, odometer, notes",
          )
          .in("id", vehicleIds)
      : { data: [] as any[] },
  ]);

  const customerMap = new Map<string, any>();
  for (const c of customers.data ?? []) customerMap.set(c.id, c);
  const vehicleMap = new Map<string, any>();
  for (const v of vehicles.data ?? []) vehicleMap.set(v.id, v);

  // Group services and parts by work_order_id
  const servicesByWo = new Map<string, any[]>();
  for (const s of services.data ?? []) {
    const list = servicesByWo.get(s.work_order_id) ?? [];
    list.push(s);
    servicesByWo.set(s.work_order_id, list);
  }
  const partsByWo = new Map<string, any[]>();
  for (const p of parts.data ?? []) {
    const list = partsByWo.get(p.work_order_id) ?? [];
    list.push(p);
    partsByWo.set(p.work_order_id, list);
  }
  const historyByWo = new Map<string, any[]>();
  for (const h of statusHistory.data ?? []) {
    const list = historyByWo.get(h.work_order_id) ?? [];
    list.push(h);
    historyByWo.set(h.work_order_id, list);
  }

  const mechanicIds = [
    ...new Set(
      (wos.data ?? []).flatMap((w: { mechanic_id: string | null }) =>
        w.mechanic_id ? [w.mechanic_id] : [],
      ),
    ),
  ] as string[];

  const mechanicMapData: Map<string, any> = new Map();
  if (mechanicIds.length > 0) {
    const { data: mechs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", mechanicIds);
    for (const m of mechs ?? []) mechanicMapData.set(m.id, m);
  }

  return (wos.data ?? []).map((wo: any) => ({
    ...wo,
    services: servicesByWo.get(wo.id) ?? [],
    parts: partsByWo.get(wo.id) ?? [],
    status_history: historyByWo.get(wo.id) ?? [],
    customer: wo.customer_id ? (customerMap.get(wo.customer_id) ?? null) : null,
    vehicle: wo.vehicle_id ? (vehicleMap.get(wo.vehicle_id) ?? null) : null,
    mechanic: wo.mechanic_id
      ? (mechanicMapData.get(wo.mechanic_id) ?? null)
      : null,
  }));
}

export async function getServiceCategoryBreakdownBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  allCompletedIds: string[],
): Promise<ServiceCategoryBreakdown[]> {
  if (allCompletedIds.length === 0) return [];

  // 1 query: get all service catalog items
  const { data: catalog } = await supabase
    .from("service_catalog")
    .select("id, category")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  // Group catalog IDs by category
  const catMap = new Map<string, string[]>();
  for (const item of catalog ?? []) {
    if (!item.category) continue;
    const list = catMap.get(item.category) ?? [];
    list.push(item.id);
    catMap.set(item.category, list);
  }

  // 1 query: get all WO services for completed orders
  const { data: woSvcs } = await supabase
    .from("work_order_services")
    .select("service_catalog_id, final_price")
    .in("work_order_id", allCompletedIds);

  // Group revenue by catalog_id
  const catRev = new Map<string, number>();
  const catCount = new Map<string, number>();
  for (const s of woSvcs ?? []) {
    if (!s.service_catalog_id) continue;
    catRev.set(
      s.service_catalog_id,
      (catRev.get(s.service_catalog_id) ?? 0) + Number(s.final_price),
    );
    catCount.set(
      s.service_catalog_id,
      (catCount.get(s.service_catalog_id) ?? 0) + 1,
    );
  }

  // Roll up by category
  const result: ServiceCategoryBreakdown[] = [];
  for (const [cat, ids] of catMap) {
    let revenue = 0;
    let count = 0;
    for (const id of ids) {
      revenue += catRev.get(id) ?? 0;
      count += catCount.get(id) ?? 0;
    }
    if (revenue > 0) result.push({ category: cat, revenue, count });
  }

  return result.sort((a, b) => b.revenue - a.revenue);
}

export async function getCustomerAcquisitionTrendBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  branchId: string | null = null,
): Promise<CustomerAcquisitionPoint[]> {
  // 1 query: get all customers with created_at
  const { data: customers } = await withBranchFilter(
    supabase
      .from("customers")
      .select("created_at")
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    branchId,
  );

  // Group by month in-memory
  const monthCount = new Map<string, number>();
  for (const c of customers ?? []) {
    const month = (c.created_at ?? "").slice(0, 7); // "YYYY-MM"
    if (month) monthCount.set(month, (monthCount.get(month) ?? 0) + 1);
  }

  const trend: CustomerAcquisitionPoint[] = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trend.push({ month: label, newCustomers: monthCount.get(label) ?? 0 });
  }

  return trend;
}
