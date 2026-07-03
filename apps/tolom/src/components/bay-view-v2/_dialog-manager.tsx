"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
import type { BayViewData, BaySlotData } from "@/lib/services/bay-view-service";
import type { BayViewDialogsState } from "./_use-bay-view-dialogs";
import type { BayViewPendingState } from "./_use-bay-view-pending";
import type { PaymentMethodFees } from "./_payment-fees";
import { AssignDialog } from "./assign-dialog";
import { EmptyBayActionDrawer } from "./_empty-bay-action-drawer";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import { ShiftReportDialog } from "./shift-report-dialog";
import { StatusNotesModal } from "./status-notes-modal";
import { VehicleRegistrationDrawer } from "./vehicle-registration-drawer";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

export interface DialogManagerProps {
  // Dialog/pending state from extracted hooks
  dialogs: BayViewDialogsState;
  pending: BayViewPendingState;
  // Data needed by dialogs
  data: BayViewData | null;
  branchFilter: string | undefined;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: { accountId: string; bankName: string; accountNumber: string }[];
  // Computed values
  pendingPostServiceBay: BaySlotData | null;
  readyWosCount: number;
  batchCompleteIsPending: boolean;
  // Detail drawer state
  detailWoId: string | null;
  detailDrawerOpen: boolean;
  drawerInitialAction: "add-service" | "add-part" | null;
  // Empty bay / direct assign state
  emptyBayBayNumber: number | null;
  directAssignBayNumber: number | null;
  // Handler callbacks
  handleStatusModalConfirm: (
    woId: string,
    status: string,
    notes?: string,
  ) => void;
  handlePostServiceConfirm: (data: PostServiceFormData) => Promise<void>;
  handlePickupCompleteConfirm: (data: PickupCompleteData) => Promise<void>;
  handleBatchComplete: () => Promise<void>;
  handleAssignToBay: (
    workOrderId: string,
    mechanicId?: string,
  ) => Promise<void>;
  handleRegisterAndAssign: (bayNumber: number) => void;
  handleEmptyBayQueueSelect: (workOrderId: string) => void;
  // Refresh / translation
  onRefresh: () => Promise<void>;
  t: (key: string) => string;
  // Mutation refs passed to child components
  assignMechanicMutation: {
    mutateAsync: (vars: {
      woId: string;
      mechanicId: string;
    }) => Promise<void>;
  };
  assignCustomerMutation: {
    mutateAsync: (vars: {
      woId: string;
      customerId: string | null;
      customerName?: string | null;
    }) => Promise<void>;
  };
  // State setters for drawer close cleanup
  setDetailDrawerOpen: (open: boolean) => void;
  setDetailWoId: (id: string | null) => void;
  setDrawerInitialAction: (action: "add-service" | "add-part" | null) => void;
  setEmptyBayBayNumber: (num: number | null) => void;
  setDirectAssignBayNumber: (num: number | null) => void;
}

export function DialogManager({
  dialogs,
  pending,
  data,
  branchFilter,
  paymentMethodFees,
  transferBanks,
  pendingPostServiceBay,
  readyWosCount,
  batchCompleteIsPending,
  detailWoId,
  detailDrawerOpen,
  drawerInitialAction,
  emptyBayBayNumber,
  directAssignBayNumber,
  handleStatusModalConfirm,
  handlePostServiceConfirm,
  handlePickupCompleteConfirm,
  handleBatchComplete,
  handleAssignToBay,
  handleRegisterAndAssign,
  handleEmptyBayQueueSelect,
  onRefresh,
  t,
  assignMechanicMutation,
  assignCustomerMutation,
  setDetailDrawerOpen,
  setDetailWoId,
  setDrawerInitialAction,
  setEmptyBayBayNumber,
  setDirectAssignBayNumber,
}: DialogManagerProps) {
  const handleDetailDrawerClose = useCallback(
    (open: boolean) => {
      setDetailDrawerOpen(open);
      if (!open) {
        setDetailWoId(null);
        setDrawerInitialAction(null);
        const params = new URLSearchParams(window.location.search);
        params.delete("woId");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    },
    [setDetailDrawerOpen, setDetailWoId, setDrawerInitialAction],
  );

  const handleVehicleRegOpenChange = useCallback(
    (open: boolean) => {
      dialogs.set("vehicleReg", open);
      if (!open) setDirectAssignBayNumber(null);
    },
    [dialogs, setDirectAssignBayNumber],
  );

  const handleVehicleRegQueued = useCallback(() => {
    dialogs.hide("vehicleReg");
    toast.dismiss();
    toast.success("Added to waiting queue");
  }, [dialogs]);

  const handleVehicleRegAssigned = useCallback(() => {
    dialogs.hide("vehicleReg");
    setDirectAssignBayNumber(null);
    toast.dismiss();
    toast.success(
      t("assignedDirectlyToBay", {
        bayNumber: directAssignBayNumber ?? 0,
      }),
    );
  }, [dialogs, setDirectAssignBayNumber, directAssignBayNumber, t]);

  return (
    <>
      {/* Status notes modal */}
      {pending.pending?.type === "status" && (
        <StatusNotesModal
          woId={pending.pending.woId}
          newStatus={pending.pending.status}
          onConfirm={handleStatusModalConfirm}
          onCancel={pending.clearPending}
        />
      )}

      {/* Post-service dialog */}
      {pending.pending?.type === "postService" && pendingPostServiceBay && (
        <PostServiceDialog
          open
          onOpenChange={(open) => {
            if (!open) pending.clearPending();
          }}
          woId={pending.pending.woId}
          vehicleId={pending.pending.vehicleId}
          vehiclePlate={pending.pending.vehiclePlate}
          currentOdometer={pending.pending.currentOdometer}
          bayData={pendingPostServiceBay}
          newStatus={pending.pending.newStatus}
          grandTotal={pending.pending.totalCost}
          paymentMethodFees={paymentMethodFees}
          transferBanks={transferBanks}
          onConfirm={handlePostServiceConfirm}
        />
      )}

      {/* Pickup complete dialog */}
      {pending.pending?.type === "pickupComplete" && (
        <PickupCompleteDialog
          open
          onOpenChange={(open) => {
            if (!open) pending.clearPending();
          }}
          woId={pending.pending.woId}
          vehiclePlate={pending.pending.vehiclePlate}
          totalCost={pending.pending.totalCost}
          onConfirm={handlePickupCompleteConfirm}
        />
      )}

      {/* Batch complete confirmation */}
      <AlertDialog
        open={dialogs.open.batchComplete}
        onOpenChange={(v) => dialogs.set("batchComplete", v)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("batchCompleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("batchCompleteConfirmDesc", { count: readyWosCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                dialogs.hide("batchComplete");
                await handleBatchComplete();
              }}
              disabled={batchCompleteIsPending}
            >
              {batchCompleteIsPending
                ? t("batchCompleteProcessing")
                : t("batchComplete", { count: readyWosCount })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign dialog */}
      <AssignDialog
        key={dialogs.assignBay ?? "closed"}
        open={dialogs.open.assign}
        onOpenChange={(open) => {
          if (!open) dialogs.closeAssign();
        }}
        bayNumber={dialogs.assignBay ?? 0}
        queue={data?.waitingQueue ?? []}
        mechanics={data?.mechanics ?? []}
        onAssign={handleAssignToBay}
        branchId={branchFilter}
      />

      {/* Empty bay action drawer */}
      <EmptyBayActionDrawer
        open={emptyBayBayNumber !== null}
        onOpenChange={(open) => {
          if (!open) setEmptyBayBayNumber(null);
        }}
        bayNumber={emptyBayBayNumber ?? 0}
        queue={data?.waitingQueue ?? []}
        onSelectRegister={() => {
          setEmptyBayBayNumber(null);
          dialogs.set("vehicleReg", true);
        }}
        onSelectRegisterAndAssign={() => {
          handleRegisterAndAssign(emptyBayBayNumber ?? 0);
        }}
        onSelectQueueItem={handleEmptyBayQueueSelect}
      />

      {/* Work order detail drawer */}
      <ErrorBoundary>
        <WorkOrderDetailDrawer
          workOrderId={detailWoId}
          open={detailDrawerOpen}
          onOpenChange={handleDetailDrawerClose}
          onRefresh={onRefresh}
          initialAction={drawerInitialAction}
          branchFilter={branchFilter}
          assignMechanicMutation={assignMechanicMutation}
          assignCustomerMutation={assignCustomerMutation}
        />
      </ErrorBoundary>

      {/* Shift report dialog */}
      <ShiftReportDialog
        open={dialogs.open.shiftReport}
        onOpenChange={(v) => dialogs.set("shiftReport", v)}
      />

      {/* Vehicle registration drawer */}
      <VehicleRegistrationDrawer
        open={dialogs.open.vehicleReg}
        onOpenChange={handleVehicleRegOpenChange}
        onQueued={handleVehicleRegQueued}
        onAssigned={handleVehicleRegAssigned}
        assignBayNumber={directAssignBayNumber ?? undefined}
        branchId={branchFilter}
      />
    </>
  );
}
