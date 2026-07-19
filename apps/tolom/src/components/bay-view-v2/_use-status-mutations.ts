"use client";

import { useOrgMutation } from "@zuiio/query";
import { useState } from "react";
import { toast } from "sonner";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import { drawerDetailKeys } from "@/lib/queries/use-drawer-queries";
import { reportServerError } from "@/lib/sentry-report-server";
import type { WorkOrderDetail } from "@/lib/types";
import type { DrawerDetailResponse } from "@/lib/queries/use-drawer-queries";

// ─── Params ────────────────────────────────────────────────────────────

interface UseStatusMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  orgId: string | undefined;
  branchId: string | undefined;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  onRefresh: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useStatusMutations({
  workOrderId,
  orgIdRef,
  orgId,
  branchId,
  wo,
  setWo,
  onRefresh,
}: UseStatusMutationsParams) {
  // ── State ──

  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // ── Status mutation (useOrgMutation) ──

  const isDestructive = (s: string) => s === "Completed" || s === "Cancelled";

  const statusMutation = useOrgMutation<
    unknown,
    { status: string; notes?: string }
  >({
    endpoint: (_vars) =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    optimisticQueryKey: orgId && workOrderId
      ? drawerDetailKeys.all(orgId, workOrderId)
      : undefined,
    onOptimisticUpdate: (qc, vars) => {
      if (!orgId || !workOrderId) return undefined;
      const key = drawerDetailKeys.all(orgId, workOrderId);
      const prev = qc.getQueryData<DrawerDetailResponse>(key);
      if (prev?.workOrder) {
        qc.setQueryData<DrawerDetailResponse>(key, {
          ...prev,
          workOrder: { ...prev.workOrder, status: vars.status } as WorkOrderDetail,
        });
      }
      return prev;
    },
    invalidateKeys: branchId
      ? ([bayViewKeys.data(branchId)] as const)
      : undefined,
    onSuccess: () => {
      onRefresh();
    },
  });

  // ── Status change (optimistic, no confirmation) ──

  async function changeStatus(newStatus: string) {
    const orgIdCurrent = orgIdRef.current;
    if (!orgIdCurrent || !workOrderId) return;

    const prevWo = wo;
    const destructive = isDestructive(newStatus);

    try {
      await statusMutation.mutateAsync({ status: newStatus });
    } catch {
      // Rollback: onOptimisticUpdate handles cache, but we also restore local state
      if (prevWo) setWo(prevWo);
      return;
    }

    // Success toast (manual to support undo pattern)
    if (destructive) {
      toast.dismiss();
      toast(`Status changed to ${newStatus}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await statusMutation.mutateAsync({
                status: prevWo?.status ?? "",
              });
            } catch (err) {
              reportServerError("Status undo failed", err);
              toast.error("Failed to undo status change");
            }
          },
        },
        duration: 8000,
      });
    } else {
      toast.dismiss();
      toast.success(`Status changed to ${newStatus}`);
    }
  }

  // ── Status confirm (from confirmation dialog, supports notes) ──

  async function handleStatusConfirm() {
    const status = confirmStatus;
    if (!status || !orgIdRef.current || !workOrderId) return;

    const prevWo = wo;
    const notes = statusNotes;

    // Clear confirmation state immediately
    setConfirmStatus(null);
    setStatusNotes("");


    try {
      const payload: Record<string, string> = { status };
      if (notes) {
        payload.notes = notes;
      }
      await statusMutation.mutateAsync(
        payload as { status: string; notes?: string },
      );
      toast.dismiss();
      toast.success(`Status changed to ${status}`);
    } catch {
      if (prevWo) setWo(prevWo);
    }
  }

  // ── Computed ──

  const canCancel: boolean =
    !!wo?.status && !["Completed", "Cancelled"].includes(wo.status ?? "");

  // ── Return ──

  return {
    confirmStatus,
    setConfirmStatus,
    statusNotes,
    setStatusNotes,
    changeStatus,
    handleStatusConfirm,
    canCancel,
  };
}
