/**
 * sales.status_history helpers (migration 20260811100000_storefront_gaps.sql).
 *
 * Every sale carries a JSONB trail of {status, at (ISO-8601), by} entries:
 *   - seeded by the BEFORE INSERT trigger (submit_shop_order → pending/buyer,
 *     process_shop_sale → completed/staff),
 *   - appended by cancel_my_order (cancelled/buyer),
 *   - appended by staff dashboard server actions via appendSaleStatusHistory
 *     (confirm/refund/cancel → staff).
 *
 * The staff path is a read-modify-write on the existing sale row through the
 * caller's own JWT, so sales RLS (org-scoped has_permission('sales.update'))
 * gates the update exactly like every other dashboard mutation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { withDbCapture } from "@zuiio/capture";
import type { Json } from "@/lib/database.types";
import type { Database } from "@/lib/supabase/types";

export type SaleHistoryBy = "buyer" | "staff" | "system";

export interface SaleStatusHistoryEntry {
  status: string;
  at: string;
  by: SaleHistoryBy;
}

/** Build a single history entry in the DB shape ({status, at, by}). */
export function saleHistoryEntry(
  status: string,
  by: SaleHistoryBy,
  at: string = new Date().toISOString(),
): SaleStatusHistoryEntry {
  return { status, at, by };
}

/**
 * Append a status entry to a sale's status_history (read-modify-write).
 * Requires the caller's role to pass the sales UPDATE RLS policy
 * (staff with sales.update); buyers are blocked from foreign rows.
 */
export async function appendSaleStatusHistory(
  supabase: SupabaseClient<Database>,
  saleId: string,
  status: string,
  by: SaleHistoryBy,
): Promise<{ error: string | null }> {
  const { data: sale, error: readError } = await withDbCapture(
    "appendSaleStatusHistory: read sale",
    supabase
      .from("sales")
      .select("status_history")
      .eq("id", saleId)
      .maybeSingle(),
  );
  if (readError || !sale) {
    return { error: readError?.message ?? "Захиалга олдсонгүй" };
  }

  const raw = (sale as { status_history?: unknown }).status_history;
  const history = Array.isArray(raw) ? (raw as SaleStatusHistoryEntry[]) : [];
  // Concrete interface → Json needs the unknown bridge (Json's index
  // signature rejects structural object types).
  const nextHistory = [
    ...history,
    saleHistoryEntry(status, by),
  ] as unknown as Json;

  const { error } = await withDbCapture(
    "appendSaleStatusHistory: append entry",
    supabase
      .from("sales")
      .update({ status_history: nextHistory })
      .eq("id", saleId),
  );

  return { error: error?.message ?? null };
}
