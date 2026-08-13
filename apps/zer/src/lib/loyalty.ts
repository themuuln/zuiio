/**
 * Loyalty program service
 */

export interface LoyaltySettings {
  id: string;
  organization_id: string;
  points_per_mnt: number;
  min_purchase: number;
  is_enabled: boolean;
  created_at: string;
}

export interface LoyaltyPoints {
  id: string;
  organization_id: string;
  customer_id: string;
  points: number;
  type: "earned" | "redeemed" | "expired" | "adjusted";
  reference_id: string | null;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  discount_type: string | null;
  discount_value: number | null;
  is_active: boolean;
  created_at: string;
}

export function calculatePointsEarned(
  amount: number,
  pointsPerMnt: number,
  minPurchase: number,
): number {
  if (pointsPerMnt <= 0) return 0;
  if (amount < minPurchase) return 0;
  return Math.floor(amount * pointsPerMnt);
}

export function calculateDiscountFromPoints(
  points: number,
  pointsPerMnt: number,
): number {
  return points / pointsPerMnt;
}

export function canRedeemReward(
  customerPoints: number,
  rewardCost: number,
): boolean {
  return customerPoints >= rewardCost;
}

export function formatPoints(points: number): string {
  return points.toLocaleString("mn-MN");
}

export function getPointsTier(totalEarned: number): {
  name: string;
  color: string;
  nextThreshold: number | null;
} {
  if (totalEarned >= 10000)
    return { name: "Алтан", color: "text-yellow-500", nextThreshold: null };
  if (totalEarned >= 5000)
    return { name: "Мөнгөн", color: "text-gray-400", nextThreshold: 10000 };
  if (totalEarned >= 1000)
    return { name: "Хүрэн", color: "text-amber-600", nextThreshold: 5000 };
  return {
    name: "Энгийн",
    color: "text-muted-foreground",
    nextThreshold: 1000,
  };
}
