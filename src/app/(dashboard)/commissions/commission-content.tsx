"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { commissionKeys } from "@/lib/query/keys";
import {
  useCommissionSummary,
  usePayoutHistory,
  useUnpaidItems,
} from "@/lib/query/useCommissions";
import { PayoutHistoryList } from "./components/payout-history";
import { StaffCard } from "./components/staff-card";
import { StaffDrillDown } from "./components/staff-drill-down";

export function CommissionContent({ orgId }: { orgId: string }) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useCommissionSummary(orgId);

  const { data: unpaidItems, isLoading: unpaidLoading } = useUnpaidItems(
    orgId,
    selectedProfileId ?? "",
  );

  const { data: payoutHistory, isLoading: historyLoading } =
    usePayoutHistory(orgId);

  const queryClient = useQueryClient();

  const selectedProfile = summary?.find(
    (s) => s.profileId === selectedProfileId,
  );

  function handleStaffSelect(profileId: string) {
    setSelectedProfileId((prev) => (prev === profileId ? null : profileId));
  }

  function handlePayoutSuccess() {
    // Invalidate all commission queries to refresh data
    queryClient.invalidateQueries({ queryKey: commissionKeys.all() });
  }

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Уншиж байна...
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        Алдаа гарлаа: {summaryError.message}
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card/50 py-20 text-center">
        <div className="text-4xl">📊</div>
        <h3 className="text-lg font-semibold">Комиссын мэдээлэл байхгүй</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Одоогоор комиссын мэдээлэл байхгүй байна. Борлуулалт хийж, ажилтанд
          комисс тооцсоны дараа энэ хэсэгт мэдээлэл гарч ирнэ.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Staff Summary Cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Ажилтнуудын комисс</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((staff) => (
            <StaffCard
              key={staff.profileId}
              staff={staff}
              isSelected={selectedProfileId === staff.profileId}
              onSelect={() => handleStaffSelect(staff.profileId)}
            />
          ))}
        </div>
      </section>

      {/* Staff Drill-down: Unpaid Items */}
      {selectedProfile && (
        <section>
          <StaffDrillDown
            orgId={orgId}
            profileId={selectedProfile.profileId}
            profileName={selectedProfile.fullName}
            items={unpaidItems ?? []}
            isLoading={unpaidLoading}
            onSuccess={handlePayoutSuccess}
          />
        </section>
      )}

      {/* Payout History */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Төлөлтийн түүх</h2>
        <PayoutHistoryList
          payouts={payoutHistory ?? []}
          isLoading={historyLoading}
        />
      </section>
    </div>
  );
}
