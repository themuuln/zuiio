"use client";

import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  assignToFirstAvailableBay,
  removeVehicleFromBay,
  updateWorkOrderStatus,
} from "@/lib/services/bay-view-service";

interface ToastState {
  message: string;
  variant: "info" | "error";
}

interface UseBayActionHandlersParams {
  data: BayViewData | null;
  setData: React.Dispatch<React.SetStateAction<BayViewData | null>>;
  setPendingStatusChange: React.Dispatch<
    React.SetStateAction<{ woId: string; status: string } | null>
  >;
  markPending: (...ids: string[]) => void;
  clearPending: (...ids: string[]) => void;
  fetchData: (showLoader?: boolean) => Promise<void>;
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>;
}

export function useBayActionHandlers({
  data,
  setData,
  setPendingStatusChange,
  markPending,
  clearPending,
  fetchData,
  setToast,
}: UseBayActionHandlersParams) {
  function handleStatusClick(woId: string, status: string) {
    setPendingStatusChange({ woId, status });
  }

  async function handleStatusChangeConfirm(
    woId: string,
    status: string,
    notes?: string,
  ) {
    setPendingStatusChange(null);
    markPending(woId);
    const prev = data;

    setData((d) =>
      d
        ? {
            ...d,
            bays: d.bays.map((b) =>
              b.workOrder?.id === woId
                ? {
                    ...b,
                    workOrder: b.workOrder
                      ? {
                          ...b.workOrder,
                          status: status as typeof b.workOrder.status,
                          bay_number:
                            status === "Completed" || status === "Cancelled"
                              ? null
                              : b.workOrder.bay_number,
                        }
                      : null,
                  }
                : b,
            ),
          }
        : d,
    );

    try {
      await updateWorkOrderStatus(
        woId,
        status as "Ready for Pickup" | "Completed",
        notes,
      );
    } catch (err) {
      if (prev) setData(prev);
      setToast({
        message: `Failed to change status: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "error",
      });
    } finally {
      clearPending(woId);
      fetchData(false);
    }
  }

  async function handleQuickAssign(woId: string) {
    markPending(woId);
    const prev = data;
    try {
      const bay = await assignToFirstAvailableBay(woId);
      setData((d) => {
        if (!d) return d;
        const movedWO = d.waitingQueue.find((w) => w.id === woId);
        if (!movedWO) return d;
        const enriched = {
          ...movedWO,
          bay_number: bay,
          status: "Diagnosing" as const,
          mechanic: null,
          customer_name: null,
        };
        return {
          ...d,
          waitingQueue: d.waitingQueue.filter((w) => w.id !== woId),
          bays: d.bays.map((b) =>
            b.bayNumber === bay ? { ...b, workOrder: enriched } : b,
          ),
        };
      });
      setToast({ message: `Assigned to Bay ${bay}`, variant: "info" });
    } catch (err) {
      if (prev) setData(prev);
      setToast({
        message: `Failed: ${err instanceof Error ? err.message : "error"}`,
        variant: "error",
      });
    } finally {
      clearPending(woId);
      fetchData(false);
    }
  }

  async function handleRemoveFromBay(woId: string) {
    markPending(woId);
    const prev = data;
    setData((d) => {
      if (!d) return d;
      const removedWO = d.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
      if (!removedWO) return d;
      return {
        ...d,
        bays: d.bays.map((b) =>
          b.workOrder?.id === woId ? { ...b, workOrder: null } : b,
        ),
        waitingQueue: [
          ...d.waitingQueue,
          { ...removedWO, bay_number: null, status: "New" as const },
        ],
      };
    });
    try {
      await removeVehicleFromBay(woId);
    } catch (err) {
      if (prev) setData(prev);
      setToast({
        message: `Failed to remove: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "error",
      });
    } finally {
      clearPending(woId);
      fetchData(false);
    }
  }

  async function handleBayCountChange(count: number) {
    if (!data) return;
    const prevCount = data.bayCount;
    const prevBays = data.bays;

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bayCount: count,
        bays: Array.from({ length: count }, (_, i) => {
          const existing = prev.bays[i];
          return existing ?? { bayNumber: i + 1, workOrder: null };
        }),
      };
    });

    try {
      const { updateBayCount } = await import(
        "@/lib/services/bay-view-service"
      );
      await updateBayCount(count);
    } catch {
      setData((prev) => ({ ...prev!, bayCount: prevCount, bays: prevBays }));
      setToast({
        message: "Failed to update bay count — reverted",
        variant: "error",
      });
    }
  }

  return {
    handleStatusClick,
    handleStatusChangeConfirm,
    handleQuickAssign,
    handleRemoveFromBay,
    handleBayCountChange,
  };
}
