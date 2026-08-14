"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  PayoutRecord,
  StaffCommissionSummary,
  UnpaidSaleItem,
} from "@/app/(dashboard)/commissions/actions";
import {
  getCommissionSummary,
  getPayoutHistory,
  getUnpaidItems,
} from "@/app/(dashboard)/commissions/actions";
import { commissionKeys } from "@/lib/query/keys";

/**
 * Hook to fetch per-staff commission summary for an organization.
 */
export function useCommissionSummary(orgId: string) {
  return useQuery<StaffCommissionSummary[]>({
    queryKey: commissionKeys.summary(orgId),
    queryFn: () => getCommissionSummary(orgId),
    enabled: !!orgId,
  });
}

/**
 * Hook to fetch unpaid sale_items for a specific staff member.
 */
export function useUnpaidItems(orgId: string, profileId: string) {
  return useQuery<UnpaidSaleItem[]>({
    queryKey: commissionKeys.unpaidItems(orgId, profileId),
    queryFn: () => getUnpaidItems(orgId, profileId),
    enabled: !!orgId && !!profileId,
  });
}

/**
 * Hook to fetch payout history for an organization.
 */
export function usePayoutHistory(orgId: string) {
  return useQuery<PayoutRecord[]>({
    queryKey: commissionKeys.history(orgId),
    queryFn: () => getPayoutHistory(orgId),
    enabled: !!orgId,
  });
}
