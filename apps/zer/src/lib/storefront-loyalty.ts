import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storefront loyalty contract — mirrors `get_public_loyalty`
 * (supabase/migrations/20260813020000_storefront_loyalty_hardware.sql).
 * Typed manually because the generated types lag the migration until the
 * next regen.
 */
export type PublicLoyaltyPointEntry = {
  id: string;
  points: number;
  type: "earned" | "redeemed" | "expired" | "adjusted";
  notes: string | null;
  reference_id: string | null;
  created_at: string;
};

export type PublicLoyaltyReward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  discount_type: string | null;
  discount_value: number | null;
};

export type PublicLoyalty = {
  enabled: boolean;
  balance: number;
  points_per_mnt: number;
  min_purchase: number;
  history: PublicLoyaltyPointEntry[];
  rewards: PublicLoyaltyReward[];
};

export async function fetchPublicLoyalty(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublicLoyalty | null> {
  const result = (await supabase.rpc("get_public_loyalty", {
    p_slug: slug,
  })) as {
    data: PublicLoyalty | null;
    error: { message: string } | null;
  };
  if (result.error || !result.data) return null;
  return result.data;
}

/**
 * Money value of `points` under the org's earn rate: points / points_per_mnt.
 */
export function pointsToMoney(points: number, pointsPerMnt: number): number {
  if (pointsPerMnt <= 0) return 0;
  return points / pointsPerMnt;
}

/**
 * Max points a buyer can redeem against a payable amount: redeeming more
 * would only discount past zero. floor(payable × rate).
 */
export function maxRedeemablePoints(
  payable: number,
  pointsPerMnt: number,
): number {
  if (pointsPerMnt <= 0 || payable <= 0) return 0;
  return Math.floor(payable * pointsPerMnt);
}

/** Earliest entry first — the RPC returns newest-first. */
export function sortHistoryNewestFirst(
  history: PublicLoyaltyPointEntry[],
): PublicLoyaltyPointEntry[] {
  return [...history].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
