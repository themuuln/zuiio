"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
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
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
import type { PaymentMethodFees } from "./_payment-fees";
import type { BayViewDialogsState } from "./_use-bay-view-dialogs";
import type { BayViewPendingState } from "./_use-bay-view-pending";
import { AssignDialog } from "./assign-dialog";
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
  transferBanks: ResolvedTransferBank[];
  // Computed values
  pendingPostServiceBay: BaySlotData | null;
  readyWosCount: number;
  batchCompleteIsPending: boolean;
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
  // Refresh / translation
  onRefresh: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  // Mutation refs passed to child components
  assignMechanicMutation: {
    mutateAsync: (vars: { woId: string; mechanicId: string }) => Promise<void>;
  };
  assignCustomerMutation: {
    mutateAsync: (vars: {
      woId: string;
      customerId: string | null;
      customerName?: string | null;
    }) => Promise<void>;
  };
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
  handleStatusModalConfirm,
  handlePostServiceConfirm,
  handlePickupCompleteConfirm,
  handleBatchComplete,
  handleAssignToBay,
  onRefresh,
  t,
  assignMechanicMutation,
  assignCustomerMutation,
}: DialogManagerProps) {
  const handleDetailDrawerClose = useCallback(
    (open: boolean) => {
      if (!open) {
        dialogs.closeDetail();
        const params = new URLSearchParams(window.location.search);
        params.delete("woId");
        window.history.replaceState(null, "", `?${params.toString()}`);
      }
    },
    [dialogs],
  );
  const handleVehicleRegOpenChange = useCallback(
    (open: boolean) => {
      dialogs.set("vehicleReg", open);
      if (!open) dialogs.setDirectAssignBayNumber(null);
    },
    [dialogs],
  );

  const handleVehicleRegQueued = useCallback(() => {
    dialogs.hide("vehicleReg");
    toast.dismiss();
    toast.success("Added to waiting queue");
  }, [dialogs]);

  const handleVehicleRegAssigned = useCallback(() => {
    dialogs.hide("vehicleReg");
    dialogs.setDirectAssignBayNumber(null);
    toast.dismiss();
    toast.success(
      t("assignedDirectlyToBay", {
        bayNumber: dialogs.directAssignBayNumber ?? 0,
      }),
    );
  }, [dialogs, t]);

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
      {/* Vehicle registration drawer */}
      <VehicleRegistrationDrawer
        open={dialogs.open.vehicleReg}
        onOpenChange={handleVehicleRegOpenChange}
        onQueued={handleVehicleRegQueued}
        onAssigned={handleVehicleRegAssigned}
        onRefresh={onRefresh}
        assignBayNumber={dialogs.directAssignBayNumber ?? undefined}
        branchId={branchFilter}
      />

      {/* Work order detail drawer */}
      <ErrorBoundary>
        <WorkOrderDetailDrawer
          workOrderId={dialogs.detailWoId}
          open={dialogs.detailWoId !== null}
          onOpenChange={handleDetailDrawerClose}
          onRefresh={onRefresh}
          initialAction={dialogs.drawerInitialAction}
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
    </>
  );
}
