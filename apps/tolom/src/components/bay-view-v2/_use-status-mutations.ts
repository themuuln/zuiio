"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { WorkOrderDetail } from "@/lib/types";

// ─── Params ────────────────────────────────────────────────────────────

interface UseStatusMutationsParams {
  workOrderId: string | null;
  orgIdRef: React.MutableRefObject<string | null>;
  wo: WorkOrderDetail | null;
  setWo: React.Dispatch<React.SetStateAction<WorkOrderDetail | null>>;
  fetchWo: (silent?: boolean, orgIdOverride?: string) => Promise<void>;
  onRefresh: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useStatusMutations({
  workOrderId,
  orgIdRef,
  wo,
  setWo,
  fetchWo,
  onRefresh,
}: UseStatusMutationsParams) {
  // ── State ──

  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  // ── Status change (optimistic, no confirmation) ──

  async function changeStatus(newStatus: string) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId) return;

    const prevWo = wo;
    const isDestructive =
      newStatus === "Completed" || newStatus === "Cancelled";

    // Optimistic: update UI immediately
    setWo((prev) =>
      prev ? ({ ...prev, status: newStatus } as WorkOrderDetail) : prev,
    );

    if (isDestructive) {
      toast.dismiss();
      toast(`Status changed to ${newStatus}`, {
        action: {
          label: "Undo",
          onClick: () => {
            if (prevWo) setWo(prevWo);
            fetch(
              `/api/organizations/${orgId}/work-orders/${workOrderId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: prevWo?.status }),
              },
            )
              .then(() => {
                fetchWo(true);
                onRefresh();
              })
              .catch(() => {});
          },
        },
        duration: 8000,
      });
    } else {
      toast.dismiss();
      toast.success(`Status changed to ${newStatus}`);
    }

    fetch(`/api/organizations/${orgId}/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          if (prevWo) setWo(prevWo);
          toast.error(json.error.message ?? "Failed to update status");
        } else {
          fetchWo(true);
          onRefresh();
        }
      })
      .catch(() => {
        if (prevWo) setWo(prevWo);
        toast.error("Failed to update status");
      });
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

    // Optimistic: update UI immediately
    setWo((prev) =>
      prev ? ({ ...prev, status } as WorkOrderDetail) : prev,
    );

    try {
      const payload: Record<string, string> = { status };
      if (notes) {
        payload.notes = notes;
      }

      const res = await fetch(
        `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (json.error) {
        if (prevWo) setWo(prevWo);
        toast.error(json.error.message ?? "Failed to update status");
      } else {
        toast.dismiss();
        toast.success(`Status changed to ${status}`);
        fetchWo(true);
        onRefresh();
      }
    } catch {
      if (prevWo) setWo(prevWo);
      toast.error("Failed to update status");
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
