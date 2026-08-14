import type { SupabaseClient } from "@supabase/supabase-js";
import { withBranchFilter } from "@/lib/supabase/with-branch";
import type {
  InventoryTurnover,
  SlowMovingItem,
  UsageTrend,
} from "@/lib/types";

// ── Inventory Turnover ──────────────────────────────────────

/**
 * COGS / average inventory value over a period.
 * COGS is derived from purchase movement costs.
 * Average inventory value is current stock-on-hand * default_price.
 */
export async function getInventoryTurnover(
  db: SupabaseClient,
  orgId: string,
  months = 12,
  branchId?: string | null,
): Promise<InventoryTurnover> {
  const supabase = db;

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  // COGS: total purchase cost in period
  let purchasesQuery = supabase
    .from("inventory_movements")
    .select("quantity, unit_cost")
    .eq("organization_id", orgId)
    .eq("movement_type", "purchase")
    .gte("created_at", since.toISOString());
  if (branchId) purchasesQuery = withBranchFilter(purchasesQuery, branchId);

  // Current stock value
  let balancesQuery = supabase
    .from("inventory_balances")
    .select("quantity_on_hand, default_price")
    .eq("organization_id", orgId);
  if (branchId) balancesQuery = withBranchFilter(balancesQuery, branchId);

  const [purchasesResult, balancesResult] = await Promise.all([
    purchasesQuery,
    balancesQuery,
  ]);

  const purchases = purchasesResult.data;
  const balances = balancesResult.data;

  const cogs =
    purchases?.reduce((sum, m) => sum + m.quantity * (m.unit_cost ?? 0), 0) ??
    0;

  const averageInventoryValue =
    balances?.reduce(
      (sum, b) => sum + b.quantity_on_hand * (b.default_price ?? 0),
      0,
    ) ?? 0;

  return {
    cogs,
    averageInventoryValue,
    turnoverRate: averageInventoryValue > 0 ? cogs / averageInventoryValue : 0,
  };
}

// ── Usage Trends ─────────────────────────────────────────────

interface UsageTrendRow {
  month: string;
  part_id: string;
  part_name: string;
  category: string | null;
  quantity: number;
  totalAmount: number;
}

/**
 * Monthly usage by part and category from sale movements.
 */
export async function getUsageTrends(
  db: SupabaseClient,
  orgId: string,
  months = 6,
  branchId?: string | null,
): Promise<UsageTrend[]> {
  const supabase = db;

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  let query = supabase
    .from("inventory_movements")
    .select(
      `
      created_at,
      part_id,
      quantity,
      unit_price,
      part:parts_catalog(name, category)
    `,
    )
    .eq("organization_id", orgId)
    .eq("movement_type", "sale")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });
  if (branchId) query = withBranchFilter(query, branchId);
  const { data, error } = await query;

  if (error) throw new Error(error.message);

  // Group by year-month + part_id
  const grouped = new Map<string, UsageTrendRow>();

  for (const m of data ?? []) {
    const month = m.created_at?.slice(0, 7) ?? "unknown";
    const key = `${month}:${m.part_id}`;
    const existing = grouped.get(key);
    const part = (Array.isArray(m.part) ? m.part[0] : m.part) as {
      name: string;
      category: string | null;
    } | null;

    if (existing) {
      existing.quantity += m.quantity;
      existing.totalAmount += m.quantity * (m.unit_price ?? 0);
    } else {
      grouped.set(key, {
        month,
        part_id: m.part_id,
        part_name: part?.name ?? "Unknown",
        category: part?.category ?? null,
        quantity: m.quantity,
        totalAmount: m.quantity * (m.unit_price ?? 0),
      });
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({
      month: row.month,
      part_id: row.part_id,
      partName: row.part_name,
      category: row.category,
      quantity: row.quantity,
      totalAmount: row.totalAmount,
    }));
}

// ── Slow-Moving Stock ────────────────────────────────────────

/**
 * Parts with quantity on hand but no sale movement in the last N days.
 */
export async function getSlowMovingStock(
  db: SupabaseClient,
  orgId: string,
  thresholdDays = 90,
  branchId?: string | null,
): Promise<SlowMovingItem[]> {
  const supabase = db;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  // Get all balances with positive stock
  let balancesQuery = supabase
    .from("inventory_balances")
    .select(
      "part_id, part_name, part_number, quantity_on_hand, category, last_movement_at",
    )
    .eq("organization_id", orgId)
    .gt("quantity_on_hand", 0);
  if (branchId) balancesQuery = withBranchFilter(balancesQuery, branchId);
  const { data: balances } = await balancesQuery;

  if (!balances?.length) return [];

  // For each part, check if there's a recent sale
  const results: SlowMovingItem[] = [];

  for (const b of balances) {
    // If part has never moved or last movement is before cutoff
    const isSlow = !b.last_movement_at || new Date(b.last_movement_at) < cutoff;

    if (isSlow) {
      const lastDate = b.last_movement_at ? new Date(b.last_movement_at) : null;
      const daysSince = lastDate
        ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : thresholdDays + 1;

      results.push({
        partId: b.part_id,
        partName: b.part_name,
        partNumber: b.part_number,
        quantity: b.quantity_on_hand,
        category: b.category,
        lastMovementDate: b.last_movement_at,
        daysSinceLastMove: daysSince,
      });
    }
  }

  // Sort by days since last move descending (oldest first)
  return results.sort((a, b) => b.daysSinceLastMove - a.daysSinceLastMove);
}
