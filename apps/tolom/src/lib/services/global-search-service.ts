import type { SupabaseClient } from "@supabase/supabase-js";
import { searchCustomers } from "./customer-service";
import { getInventoryFast } from "./inventory-service";
import { getVehicles } from "./vehicle-service";
import { getWorkOrders } from "./work-order-service";

// ── Types ────────────────────────────────────────────────────────────

export interface GlobalCustomerHit {
  id: string;
  name: string;
  phone: string | null;
}

export interface GlobalVehicleHit {
  id: string;
  plateNumber: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  ownerName: string | null;
}

export interface GlobalWorkOrderHit {
  id: string;
  plateNumber: string | null;
  customerName: string | null;
  status: string;
  createdAt: string;
}

export interface GlobalPartHit {
  id: string | null;
  name: string | null;
  partNumber: string | null;
  stock: number | null;
}

export interface GlobalSearchResult {
  customers: GlobalCustomerHit[];
  vehicles: GlobalVehicleHit[];
  workOrders: GlobalWorkOrderHit[];
  parts: GlobalPartHit[];
}

export interface GlobalSearchOptions {
  /** Max results per entity. Defaults to 5, capped at 8. */
  limit?: number;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;

// ── Service ──────────────────────────────────────────────────────────

/**
 * Global "workshop counter" search: customers, vehicles, work orders and
 * parts in one parallel query. Composes existing entity search services so
 * RLS + org scoping stay in one place.
 */
export async function globalSearch(
  db: SupabaseClient,
  orgId: string,
  query: string,
  options: GlobalSearchOptions = {},
): Promise<GlobalSearchResult> {
  const term = query.trim();
  const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  const empty: GlobalSearchResult = {
    customers: [],
    vehicles: [],
    workOrders: [],
    parts: [],
  };

  if (term.length < MIN_QUERY_LENGTH) return empty;

  const [customers, vehicles, workOrders, parts] = await Promise.all([
    searchCustomers(db, orgId, term, { page: 1, pageSize: limit }),
    getVehicles(db, orgId, { search: term, limit }),
    getWorkOrders(db, orgId, { search: term }, 1, limit),
    getInventoryFast(db, orgId, { search: term, limit }),
  ]);

  return {
    customers: (customers.data ?? []).slice(0, limit).map((c) => ({
      id: c.id,
      name:
        (c.full_name ??
          [c.first_name, c.last_name].filter(Boolean).join(" ")) ||
        "—",
      phone: c.phone ?? null,
    })),
    vehicles: (vehicles ?? []).slice(0, limit).map((v) => ({
      id: v.id,
      plateNumber: v.plate_number ?? null,
      make: v.make ?? null,
      model: v.model ?? null,
      year: v.year ?? null,
      ownerName: v.owner_name ?? null,
    })),
    workOrders: (workOrders ?? []).slice(0, limit).map((wo) => ({
      id: wo.id,
      plateNumber: wo.vehicle?.plate_number ?? null,
      customerName:
        [wo.customer?.first_name, wo.customer?.last_name]
          .filter(Boolean)
          .join(" ") || null,
      status: wo.status,
      createdAt: wo.created_at,
    })),
    parts: (parts ?? []).slice(0, limit).map((p) => ({
      id: p.part_id,
      name: p.part_name,
      partNumber: p.part_number,
      stock: p.quantity_on_hand,
    })),
  };
}
