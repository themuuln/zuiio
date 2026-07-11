import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SupabaseClientType = SupabaseClient<Database>;

export interface BusinessEventRow {
  id: string;
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
  preparation_lead_days: number | null;
  notes: string | null;
  is_active: boolean | null;
  recurrence_source: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface StockTargetRow {
  id: string;
  event_id: string;
  organization_id: string;
  product_id: string | null;
  category_id: string | null;
  target_quantity: number;
  demand_multiplier: number | null;
  created_at: string | null;
}

export interface StockShortage {
  targetId: string;
  productName: string | null;
  categoryName: string | null;
  targetQuantity: number;
  adjustedTarget: number;
  currentStock: number;
  shortage: number;
}

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

/**
 * List all business events for an organization.
 */
export async function listBusinessEvents(
  supabase: SupabaseClientType,
  organizationId: string,
): Promise<{ events: BusinessEventRow[]; error?: string }> {
  const { data, error } = await withDbCapture(
    "business-events:list",
    supabase
      .from("business_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("start_date", { ascending: false }),
  );

  if (error) {
    capture(error, { context: "listBusinessEvents" });
    return {
      events: [],
      error: "Бизнесийн үйл явдлын жагсаалт авахад алдаа гарлаа.",
    };
  }

  return { events: (data ?? []) as BusinessEventRow[] };
}

/**
 * List upcoming active events whose preparation window is within the
 * next `days` (default 30). Preparation window = start_date minus
 * preparation_lead_days.
 */
export async function getUpcomingEvents(
  supabase: SupabaseClientType,
  organizationId: string,
  days: number = 30,
): Promise<{ events: BusinessEventRow[]; error?: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await withDbCapture(
    "business-events:upcoming",
    supabase
      .from("business_events")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .lte("start_date", horizon)
      .order("start_date", { ascending: true }),
  );

  if (error) {
    capture(error, { context: "getUpcomingEvents" });
    return {
      events: [],
      error: "Удахгүй болох үйл явдлын жагсаалт авахад алдаа гарлаа.",
    };
  }

  // Filter to events whose preparation window overlaps today → horizon.
  // A preparation window opens at (start_date - lead_days) and closes
  // at start_date.
  const filtered = (data ?? []).filter((ev) => {
    const leadDays = ev.preparation_lead_days ?? 30;
    const prepStart = new Date(ev.start_date);
    prepStart.setDate(prepStart.getDate() - leadDays);
    const prepStartStr = prepStart.toISOString().slice(0, 10);
    // Preparation window overlaps [today, horizon]
    return prepStartStr <= horizon && ev.start_date >= today;
  });

  return { events: filtered as BusinessEventRow[] };
}

/* ------------------------------------------------------------------ */
/*  Stock target check                                                 */
/* ------------------------------------------------------------------ */

/**
 * Compare current product stock against configured targets for an event.
 * Returns shortages where current stock < adjusted target.
 *
 * For product-level targets, checks that product's `current_stock` directly.
 * For category-level targets, sums `current_stock` of all non-deleted
 * products in that category.
 */
export async function checkStockTargets(
  supabase: SupabaseClientType,
  organizationId: string,
  eventId: string,
): Promise<{ shortages: StockShortage[]; error?: string }> {
  // 1. Fetch the event to validate ownership
  const { data: event, error: eventError } = await withDbCapture(
    "business-events:fetch_event",
    supabase
      .from("business_events")
      .select("id")
      .eq("id", eventId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (eventError || !event) {
    return {
      shortages: [],
      error: "Үйл явдал олдсонгүй.",
    };
  }

  // 2. Fetch all stock targets for this event
  const { data: targets, error: targetError } = await withDbCapture(
    "business-events:fetch_targets",
    supabase
      .from("business_event_stock_targets")
      .select("*")
      .eq("event_id", eventId)
      .eq("organization_id", organizationId),
  );

  if (targetError) {
    capture(targetError, { context: "checkStockTargets: fetch targets" });
    return {
      shortages: [],
      error: "Зорилтот нөөцийн жагсаалт авахад алдаа гарлаа.",
    };
  }

  if (!targets || targets.length === 0) return { shortages: [] };

  const shortages: StockShortage[] = [];

  // 3. Check each target
  for (const target of targets) {
    const multiplier = target.demand_multiplier ?? 1;
    const adjustedTarget = target.target_quantity * multiplier;

    if (target.product_id) {
      // Product-level target
      const { data: product } = await withDbCapture(
        "business-events:fetch_product_stock",
        supabase
          .from("products")
          .select("name, current_stock")
          .eq("id", target.product_id)
          .eq("organization_id", organizationId)
          .single(),
      );

      const currentStock = product?.current_stock ?? 0;
      if (currentStock < adjustedTarget) {
        shortages.push({
          targetId: target.id,
          productName: product?.name ?? null,
          categoryName: null,
          targetQuantity: target.target_quantity,
          adjustedTarget,
          currentStock,
          shortage: adjustedTarget - currentStock,
        });
      }
    } else if (target.category_id) {
      // Category-level target — sum stock across all non-deleted products
      const { data: categoryProducts } = await withDbCapture(
        "business-events:fetch_category_stock",
        supabase
          .from("products")
          .select("name, current_stock")
          .eq("category_id", target.category_id)
          .eq("organization_id", organizationId)
          .is("deleted_at", null),
      );

      let totalStock = 0;
      for (const p of categoryProducts ?? []) {
        totalStock += p.current_stock ?? 0;
      }

      // Fetch category name for display
      const { data: category } = await withDbCapture(
        "business-events:fetch_category_name",
        supabase
          .from("categories")
          .select("name")
          .eq("id", target.category_id)
          .single(),
      );

      if (totalStock < adjustedTarget) {
        shortages.push({
          targetId: target.id,
          productName: null,
          categoryName: category?.name ?? null,
          targetQuantity: target.target_quantity,
          adjustedTarget,
          currentStock: totalStock,
          shortage: adjustedTarget - totalStock,
        });
      }
    }
  }

  return { shortages };
}
