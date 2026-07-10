"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import { DialogManager } from "./_dialog-manager";
import { KpiCards } from "./_kpi-cards";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { QueueRail } from "./_queue-rail";
import { BayViewTickProvider } from "./_tick-context";
import { Toolbar } from "./_toolbar";
import { GuardedPointerSensor, GuardedTouchSensor } from "./_types";
import { useBayCountMutation } from "./_use-bay-count-mutation";
import { useBayViewData } from "./_use-bay-view-data";
import { useBayViewDialogs } from "./_use-bay-view-dialogs";
import { useBayViewMutations } from "./_use-bay-view-mutations";
import { useBayViewPending } from "./_use-bay-view-pending";
import { BayViewViews } from "./_view-renderer";
import { BayCardDragPreview } from "./bay-card";

export function BayViewV2Client() {
  const t = useTranslations("bayView");
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const branchFilter =
    selectedBranchId === "all" ? undefined : selectedBranchId;
  const { data: orgInfo } = useCurrentOrg();
  const { settings: orgSettings } = useOrgSettings(orgInfo?.orgId);
  const paymentMethodFees = resolvePaymentMethodFees(
    orgSettings?.payment_method_fees,
  );
  const transferBanks = resolveOrgTransferBanks(
    normalizeOrgTransferBankAccounts(orgSettings?.transfer_bank_accounts),
  );

  // ── Extracted hooks (no data dependency) ──
  const dialogs = useBayViewDialogs();
  const pending = useBayViewPending();

  // ── Data, search, UI state, derived data, realtime ──
  const bayViewData = useBayViewData(
    orgInfo?.orgId,
    branchFilter,
    dialogs,
    pending,
  );

  // ── Mutations & handlers ──
  const mutations = useBayViewMutations({
    branchFilter,
    orgId: orgInfo?.orgId,
    data: bayViewData.data,
    fetchData: bayViewData.fetchData,
    t,
    paymentMethodFees,
    transferBanks,
    dialogs,
    pending,
    pendingWoIds: bayViewData.pendingWoIds,
    markPending: bayViewData.markPending,
    clearPending: bayViewData.clearPending,
    setActiveDrag: bayViewData.setActiveDrag,
  });

  // ── Bay count (needs data and a mutation ref) ──
  const bayCount = useBayCountMutation({
    currentBayCount: bayViewData.data?.bayCount ?? 0,
    onApply: useCallback(
      async (next: number) => {
        await mutations.updateBayCountMutation.mutateAsync({ count: next });
      },
      [mutations.updateBayCountMutation],
    ),
    onRefetch: bayViewData.fetchData,
  });

  // ── Queue rail ──────────────────────────────────────────────
  const [showQueueRail, setShowQueueRail] = useState(false);

  // ── Sensors ──
  const pointerSensor = useSensor(GuardedPointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(GuardedTouchSensor, {
    activationConstraint: { delay: 300, tolerance: 20 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // ── Loading / error ──
  const isLoading = bayViewData.loading && !bayViewData.data;
  const hasError = !!(bayViewData.error && !bayViewData.data);
  const safeData = bayViewData.data;

  const pendingPostServiceBay =
    !isLoading && pending.pending?.type === "postService"
      ? (safeData?.bays.find(
          (b) => b.workOrder?.id === pending.pending?.woId,
        ) ?? null)
      : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={mutations.onDragStart}
      onDragEnd={mutations.onDragEnd}
      onDragCancel={mutations.onDragCancel}
    >
      <BayViewTickProvider>
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          {/* ── Inline error banner ── */}
          {hasError && (
            <div className="flex items-center justify-between border-b border-destructive/20 bg-destructive/5 px-4 py-2">
              <span className="text-sm text-destructive">
                {bayViewData.error
                  ? "Couldn't load bay view. Check your internet connection."
                  : t("noData")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bayViewData.fetchData()}
                className="rounded-lg"
              >
                {t("retry")}
              </Button>
            </div>
          )}

          {/* ── Toolbar ── */}
          {isLoading ? (
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="hidden sm:block h-8 w-20 rounded-lg" />
              <Skeleton className="hidden sm:block h-8 w-20 rounded-lg" />
              <div className="flex-1" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ) : (
            <Toolbar
              viewMode={bayViewData.viewMode}
              setViewMode={bayViewData.setViewMode}
              userIsMechanic={bayViewData.userIsMechanic}
              myJobsOnly={bayViewData.myJobsOnly}
              setMyJobsOnly={bayViewData.setMyJobsOnly}
              fetchData={bayViewData.fetchData}
              baySearchQuery={bayViewData.baySearchQuery}
              setBaySearchQuery={bayViewData.setBaySearchQuery}
              readyWosCount={bayViewData.readyWosCount}
              t={t}
              batchCompletePending={mutations.batchCompleteMutation.isPending}
              setBatchCompleteDialogOpen={(v) =>
                dialogs.set("batchComplete", v)
              }
              setShowVehicleReg={(v) => dialogs.set("vehicleReg", v)}
              setShowShiftReport={(v) => dialogs.set("shiftReport", v)}
              bayCountMutationInFlightRef={bayCount.inFlightRef}
              bayCountPending={bayCount.pending}
              bayCountInputValue={bayCount.inputValue}
              setBayCountInputValue={bayCount.setInputValue}
              applyBayCountChange={bayCount.apply}
              bayCount={safeData?.bayCount ?? 0}
              branches={safeData?.branches ?? []}
              selectedBranchId={selectedBranchId}
              onBranchChange={setSelectedBranchId}
              statusFilter={bayViewData.statusFilter}
              setStatusFilter={bayViewData.setStatusFilter}
              showQueueRail={showQueueRail}
              onToggleQueue={() => setShowQueueRail((s) => !s)}
              bays={safeData?.bays ?? []}
            />
          )}

          {/* ── KPI Cards ── */}
          {isLoading ? (
            <div className="flex items-center gap-4 px-4 py-1.5 border-b border-border/30 shrink-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 px-5 py-4 min-w-0 min-h-[88px]"
                >
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div data-slot="bay-view-kpi-cards">
              <KpiCards
                shiftReport={bayViewData.shiftReport}
                trendDelta={bayViewData.trendDelta}
                occupiedBays={bayViewData.occupiedBays}
                bayCount={safeData?.bayCount ?? 0}
                waitingQueueLength={safeData?.waitingQueue?.length ?? 0}
                bays={
                  safeData?.branchSections?.flatMap(
                    (section) => section.bays,
                  ) ??
                  safeData?.bays ??
                  []
                }
                waitingQueue={safeData?.waitingQueue ?? []}
                onOpenWorkOrder={mutations.handleOpenDetail}
                t={t}
              />
            </div>
          )}

          {/* ── Bay Views / Queue Rail ── */}
          <div className="flex min-h-0 flex-1 overflow-hidden bg-transparent">
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card
                      key={i}
                      className="relative min-h-[160px] flex flex-col border-dashed border-muted-foreground/30 bg-muted/10 rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-4">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex flex-1 flex-col gap-2">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-3 w-2/5" />
                        </div>
                      </div>
                      <div className="mt-auto border-t border-border/40 p-3 flex gap-2">
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <BayViewViews
                  viewMode={bayViewData.viewMode}
                  searchedBranchSections={bayViewData.searchedBranchSections}
                  searchedBays={bayViewData.searchedBays}
                  filteredQueue={bayViewData.filteredQueue}
                  pendingWoIds={bayViewData.pendingWoIds}
                  readyWosCount={bayViewData.readyWosCount}
                  batchCompletePending={
                    mutations.batchCompleteMutation.isPending
                  }
                  onStatusChange={mutations.handleStatusClick}
                  onRemoveFromBay={mutations.handleRemoveFromBay}
                  onOpenDetail={mutations.handleOpenDetail}
                  onAssignClick={mutations.handleEmptyBayClick}
                  onQueueItemClick={mutations.handleQueueItemClick}
                  onRemoveHelper={mutations.handleRemoveHelper}
                  onAssignMechanic={mutations.handleAssignMechanic}
                  onRemoveMechanic={mutations.handleRemoveMechanic}
                  onAddHelper={mutations.handleAddHelper}
                  onReorderMechanics={mutations.handleReorderMechanics}
                  orgId={orgInfo?.orgId}
                  mechanics={safeData?.mechanics ?? []}
                  t={t}
                />
              )}
            </div>
            {!isLoading &&
              bayViewData.viewMode === "grid" &&
              (safeData?.waitingQueue?.length ?? 0) > 0 && (
                <QueueRail
                  items={safeData?.waitingQueue ?? []}
                  open={showQueueRail}
                  onToggle={() => setShowQueueRail((s) => !s)}
                  onItemClick={mutations.handleQueueItemClick}
                  onAssignToBay={(_woId) => {}}
                  t={t}
                />
              )}
          </div>
        </div>

        {/* ── Dialogs (only show when we have data) ── */}
        {!isLoading && (
          <DialogManager
            dialogs={dialogs}
            pending={pending}
            data={safeData}
            branchFilter={branchFilter}
            paymentMethodFees={paymentMethodFees}
            transferBanks={transferBanks}
            pendingPostServiceBay={pendingPostServiceBay}
            readyWosCount={bayViewData.readyWosCount}
            batchCompleteIsPending={mutations.batchCompleteMutation.isPending}
            handleStatusModalConfirm={mutations.handleStatusModalConfirm}
            handlePostServiceConfirm={mutations.handlePostServiceConfirm}
            handlePickupCompleteConfirm={mutations.handlePickupCompleteConfirm}
            handleBatchComplete={mutations.handleBatchComplete}
            handleAssignToBay={mutations.handleAssignToBay}
            handleRegisterAndAssign={mutations.handleRegisterAndAssign}
            handleEmptyBayQueueSelect={mutations.handleEmptyBayQueueSelect}
            onRefresh={bayViewData.fetchData}
            t={t}
            assignMechanicMutation={mutations.assignMechanicMutation}
            assignCustomerMutation={mutations.assignCustomerMutation}
          />
        )}

        {/* ── Drag overlay ── */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {safeData &&
            bayViewData.activeDrag &&
            (bayViewData.activeDrag.type === "vehicle" &&
            bayViewData.activeDrag.previewBay ? (
              <div className="scale-[1.03] shadow-2xl ring-1 ring-primary/20 rounded-xl overflow-hidden">
                <BayCardDragPreview bay={bayViewData.activeDrag.previewBay} />
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border-2 border-primary/40 bg-card px-4 py-2 text-sm font-semibold shadow-xl">
                <GripVertical className="size-4 text-muted-foreground/40" />
                {bayViewData.activeDrag.label}
              </div>
            ))}
        </DragOverlay>
      </BayViewTickProvider>
    </DndContext>
  );
}
