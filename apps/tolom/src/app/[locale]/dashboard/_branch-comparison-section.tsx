/**
 * BranchComparisonSection — Cross-branch KPI comparison for the dashboard.
 *
 * Shows a table comparing each branch's revenue, work orders, active orders,
 * and avg repair order. Only visible when org has 2+ branches.
 */
"use client";

import { BranchComparisonTable } from "@/components/branch-comparison-table";
import { useBranchComparison } from "@/lib/queries/use-branch-comparison";

interface BranchComparisonSectionProps {
  orgId: string | undefined;
  dateFrom: string;
  dateTo: string;
}

export function BranchComparisonSection({
  orgId,
  dateFrom,
  dateTo,
}: BranchComparisonSectionProps) {
  const { data, isLoading } = useBranchComparison(orgId, dateFrom, dateTo);

  return (
    <BranchComparisonTable
      data={data ?? null}
      loading={isLoading}
      columns={["revenue", "workOrders", "activeWorkOrders", "avgRepairOrder"]}
    />
  );
}
