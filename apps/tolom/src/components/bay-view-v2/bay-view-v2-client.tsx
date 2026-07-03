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
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import { DialogManager } from "./_dialog-manager";
import { BayViewErrorState } from "./_error-state";
import { KpiCards } from "./_kpi-cards";
import { QueueRail } from "./_queue-rail";
import { BayViewPageSkeleton } from "./_page-skeleton";
import { resolvePaymentMethodFees } from "./_payment-fees";
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
  if (bayViewData.loading && !bayViewData.data) return <BayViewPageSkeleton />;
  if (bayViewData.error || !bayViewData.data)
    return (
      <BayViewErrorState
        error={bayViewData.error}
        t={t}
        fetchData={bayViewData.fetchData}
      />
    );

  const pendingPostServiceBay =
    pending.pending?.type === "postService"
      ? (bayViewData.data.bays.find(
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
            setBatchCompleteDialogOpen={(v) => dialogs.set("batchComplete", v)}
            setShowVehicleReg={(v) => dialogs.set("vehicleReg", v)}
            setShowShiftReport={(v) => dialogs.set("shiftReport", v)}
            bayCountMutationInFlightRef={{ current: false }}
            bayCountDebounceRef={{ current: null }}
            bayCountPending={bayCount.pending}
            bayCountInputValue={bayCount.inputValue}
            setBayCountInputValue={bayCount.setInputValue}
            applyBayCountChange={bayCount.apply}
            bayCount={bayViewData.data.bayCount}
            branches={bayViewData.data.branches}
            selectedBranchId={selectedBranchId}
            onBranchChange={setSelectedBranchId}
            statusFilter={bayViewData.statusFilter}
            setStatusFilter={bayViewData.setStatusFilter}
            showQueueRail={showQueueRail}
            onToggleQueue={() => setShowQueueRail((s) => !s)}
          />

          <div data-slot="bay-view-kpi-cards">
            <KpiCards
              shiftReport={bayViewData.shiftReport}
              trendDelta={bayViewData.trendDelta}
              occupiedBays={bayViewData.occupiedBays}
              bayCount={bayViewData.data.bayCount}
              waitingQueueLength={bayViewData.data.waitingQueue.length}
              bays={
                bayViewData.data.branchSections?.flatMap(
                  (section) => section.bays,
                ) ?? bayViewData.data.bays
              }
              waitingQueue={bayViewData.data.waitingQueue}
              onOpenWorkOrder={mutations.handleOpenDetail}
              t={t}
            />
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden bg-transparent">
            <div className="flex-1 overflow-y-auto">
              <BayViewViews
                viewMode={bayViewData.viewMode}
                searchedBranchSections={bayViewData.searchedBranchSections}
                searchedBays={bayViewData.searchedBays}
                filteredQueue={bayViewData.filteredQueue}
                pendingWoIds={bayViewData.pendingWoIds}
                readyWosCount={bayViewData.readyWosCount}
                batchCompletePending={mutations.batchCompleteMutation.isPending}
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
                mechanics={bayViewData.data?.mechanics ?? []}
                t={t}
              />
            </div>
            {bayViewData.viewMode === "grid" &&
              bayViewData.data.waitingQueue.length > 0 && (
                <QueueRail
                  items={bayViewData.data.waitingQueue}
                  open={showQueueRail}
                  onToggle={() => setShowQueueRail((s) => !s)}
                  onItemClick={mutations.handleQueueItemClick}
                  onAssignToBay={(woId) => {}}
                  t={t}
                />
              )}
          </div>
        </div>

        {/* ── Dialogs ── */}
        <DialogManager
          dialogs={dialogs}
          pending={pending}
          data={bayViewData.data}
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

        {/* ── Drag overlay (kept in main file for DndContext composition) ── */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {bayViewData.activeDrag &&
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
