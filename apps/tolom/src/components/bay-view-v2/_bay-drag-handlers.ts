"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback } from "react";
import { toast } from "sonner";
import { reportServerError } from "@/lib/sentry-report-server";
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";

interface UseBayDragHandlersParams {
  data: BayViewData | null;
  setActiveDrag: React.Dispatch<
    React.SetStateAction<{
      type: string;
      label: string;
      previewBay?: BaySlotData | null;
    } | null>
  >;
  onStatusChange: (woId: string, status: string) => void;
  /** Mutation callbacks — each handles optimistic write + API call + rollback + toast */
  assignMechanic: (vars: { woId: string; mechanicId: string }) => void;
  removeMechanic: (vars: { woId: string }) => void;
  addHelper: (vars: { woId: string; mechanicId: string }) => void;
  assignToBay: (vars: { workOrderId: string; bayNumber: number }) => void;
  removeFromBay: (vars: { woId: string }) => void;
  /** Swap bays is a multi-step operation that needs custom orchestration */
  onSwapBays: (
    woId: string,
    srcBay: number,
    targetWoId: string,
    targetBay: number,
  ) => Promise<void>;
  /** Queue reorder persists the new ordering */
  onReorderQueue: (
    updates: { id: string; queue_order: number }[],
  ) => Promise<void>;
  markPending: (...ids: string[]) => void;
  clearPending: (...ids: string[]) => void;
}

export function useBayDragHandlers({
  data,
  setActiveDrag,
  onStatusChange,
  assignMechanic,
  removeMechanic,
  addHelper,
  assignToBay,
  removeFromBay,
  onSwapBays,
  onReorderQueue,
  markPending,
  clearPending,
}: UseBayDragHandlersParams) {
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const activeData = active.data.current;
    if (activeData?.type === "vehicle") {
      setActiveDrag({ type: "vehicle", label: "Vehicle" });
    } else if (activeData?.type === "mechanic") {
      setActiveDrag({ type: "mechanic", label: "Mechanic" });
    } else if (activeData?.type === "mechanic-assigned") {
      setActiveDrag({ type: "mechanic-assigned", label: "Mechanic" });
    }
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      const activeData = active.data.current;

      if (!over) {
        if (
          activeData?.type === "mechanic-assigned" &&
          activeData.workOrderId
        ) {
          // Dropped outside any droppable — remove mechanic
          removeMechanic({ woId: activeData.workOrderId });
        }
        return;
      }

      const overId = String(over.id);

      // Case 0: Dragging a bay card between kanban status columns
      if (
        activeData?.type === "vehicle" &&
        overId.startsWith("kanban-status-") &&
        data?.bays.some((b) => b.workOrder?.id === activeData.workOrderId)
      ) {
        const woId = activeData.workOrderId;
        const nextStatus = decodeURIComponent(
          overId.replace("kanban-status-", ""),
        );
        const currentStatus =
          data.bays.find((b) => b.workOrder?.id === woId)?.workOrder?.status ??
          null;

        if (!currentStatus || currentStatus === nextStatus) return;

        onStatusChange(woId, nextStatus);
        return;
      }

      // Case 1: Dragging a vehicle to a bay
      // If target bay is occupied, swap both vehicles atomically.
      if (activeData?.type === "vehicle" && overId.startsWith("bay-")) {
        const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
        const woId = activeData.workOrderId;

        const currentBay = data?.bays.find((b) => b.workOrder?.id === woId);
        if (currentBay?.bayNumber === bayNumber) return; // Dropped on its current bay, do nothing!

        // Check if target bay already has a vehicle — swap instead of assign
        const targetBay = data?.bays.find((b) => b.bayNumber === bayNumber);
        const targetWo = targetBay?.workOrder;

        if (targetWo && currentBay) {
          // Both bays occupied — use swap callback
          markPending(woId, targetWo.id);
          onSwapBays(
            woId,
            currentBay.bayNumber,
            targetWo.id,
            bayNumber,
          ).finally(() => {
            clearPending(woId, targetWo.id);
          });
          return;
        }

        // Target bay is empty — use assign mutation
        assignToBay({ workOrderId: woId, bayNumber });
        return;
      }

      // Case 2: Dragging vehicle from a bay back to waiting queue
      if (
        activeData?.type === "vehicle" &&
        (overId === "waiting-queue" || overId.startsWith("vehicle-")) &&
        data?.bays.some((b) => b.workOrder?.id === activeData.workOrderId)
      ) {
        removeFromBay({ woId: activeData.workOrderId });
        return;
      }

      // Case 3: Dragging a mechanic from roster to a bay/vehicle
      if (activeData?.type === "mechanic") {
        let targetWoId: string | null = null;

        if (overId.startsWith("bay-")) {
          const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
          const bay = data?.bays.find((b) => b.bayNumber === bayNumber);
          targetWoId = bay?.workOrder?.id ?? null;
          if (!targetWoId) {
            toast.dismiss();
            toast("Drop the vehicle here first, then assign a mechanic.");
            return;
          }
        } else if (overId.startsWith("vehicle-")) {
          targetWoId = overId.replace("vehicle-", "");
        } else if (overId.startsWith("mechanic-on-wo-")) {
          targetWoId = overId.replace("mechanic-on-wo-", "");
        }

        if (targetWoId && activeData.mechanicId) {
          const mechId = activeData.mechanicId;

          // Check if the target work order already has a main mechanic
          const targetBay = data?.bays.find(
            (b) => b.workOrder?.id === targetWoId,
          );
          const hasMainMechanic =
            targetBay?.workOrder?.mechanic != null &&
            targetBay.workOrder.mechanic.id !== mechId;

          if (!hasMainMechanic) {
            // Assign as MAIN mechanic — mutation handles cache + API + rollback
            assignMechanic({ woId: targetWoId, mechanicId: mechId });
          } else {
            // Check for no-op: mechanic is already a helper
            const existingHelpers = targetBay?.workOrder?.helpers ?? [];
            if (existingHelpers.some((h) => h.id === mechId)) {
              return; // Already a helper — no-op
            }
            // Assign as HELPER — mutation handles cache + API + rollback
            addHelper({ woId: targetWoId, mechanicId: mechId });
          }
        }
        return;
      }

      // Case 4: Dragging an assigned mechanic to another bay
      if (activeData?.type === "mechanic-assigned") {
        const mechanicId = activeData.mechanicId;
        const currentWoId = activeData.workOrderId;
        if (!mechanicId) return;

        // Dropped on a mechanic area — unassign
        if (overId.startsWith("mechanic-")) {
          removeMechanic({ woId: currentWoId });
          return;
        }

        // Find the target work order
        const findTargetWoId = (): string | null => {
          if (overId.startsWith("vehicle-")) {
            const newWoId = overId.replace("vehicle-", "");
            return newWoId !== currentWoId ? newWoId : null;
          }
          if (overId.startsWith("bay-")) {
            const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
            const bay = data?.bays.find((b) => b.bayNumber === bayNumber);
            if (!bay?.workOrder) {
              toast.dismiss();
              toast("Drop the vehicle here first, then reassign the mechanic.");
              return null;
            }
            return bay.workOrder.id !== currentWoId ? bay.workOrder.id : null;
          }
          return null;
        };

        const targetWoId = findTargetWoId();
        if (!targetWoId) return;

        // Reassign — assignMechanic mutation handles removing from source
        // and assigning to target in one cache write
        assignMechanic({ woId: targetWoId, mechanicId });
        return;
      }

      // Case 5: Reorder within waiting queue
      if (activeData?.type === "vehicle" && overId.startsWith("vehicle-")) {
        const activeWoId = activeData.workOrderId;
        const targetWoId = overId.replace("vehicle-", "");

        if (activeWoId === targetWoId) return; // Dropped on itself, do nothing!

        const queue = data?.waitingQueue ?? [];
        const queueIds = queue.map((w) => w.id);
        const activeIdx = queueIds.indexOf(activeWoId);
        const targetIdx = queueIds.indexOf(targetWoId);

        if (activeIdx !== -1 && targetIdx !== -1) {
          const reordered = arrayMove(queue, activeIdx, targetIdx);
          const updates = reordered.map((wo, i) => ({
            id: wo.id,
            queue_order: i,
          }));

          // Fire reorder in background
          onReorderQueue(updates).catch((err) => {
            reportServerError("Re-order failed:", err);
            toast.dismiss();
            toast.error("Re-order failed — please try again");
          });
        }
        return;
      }
    },
    [
      setActiveDrag,
      data,
      removeMechanic,
      onStatusChange,
      assignToBay,
      removeFromBay,
      markPending,
      clearPending,
      onSwapBays,
      onReorderQueue,
      assignMechanic,
      addHelper,
    ],
  );

  return { handleDragStart, handleDragEnd };
}
