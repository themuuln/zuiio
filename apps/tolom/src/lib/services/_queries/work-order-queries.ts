import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { WorkOrderDetail } from "@/lib/types";

/**
 * Fetches a single work order with all its related data via a single
 * Postgres RPC call. This replaces 3 sequential batch rounds (~15 queries)
 * with one database round-trip.
 *
 * Accepts a SupabaseClient so callers can reuse their existing client.
 * orgId is required for auth validation inside the RPC.
 */

export async function getWorkOrderDetail(
  supabase: SupabaseClient,
  id: string,
  orgId: string,
): Promise<WorkOrderDetail> {
  const { data, error } = await supabase.rpc("get_work_order_detail", {
    p_wo_id: id,
    p_org_id: orgId,
  });

  if (error) {
    logger.error(
      { workOrderId: id, orgId, rpcError: error },
      "getWorkOrderDetail: RPC call failed",
    );
    throw new NotFoundError("Work order not found");
  }

  return data as unknown as WorkOrderDetail;
}
