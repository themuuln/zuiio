"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { BayViewData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import {
  assignMechanicToWorkOrder,
  assignVehicleToBay,
  removeVehicleFromBay,
  reorderQueue,
  unassignMechanicFromWorkOrder,
} from "@/lib/services/bay-view-service";

interface ToastState {
  message: string;
  variant: "info" | "error";
}

interface UseBayDragHandlersParams {
  data: BayViewData | null;
  setData: React.Dispatch<React.SetStateAction<BayViewData | null>>;
  setActiveDrag: React.Dispatch<
    React.SetStateAction<{ type: string; label: string } | null>
  >;
  markPending: (...ids: string[]) => void;
  clearPending: (...ids: string[]) => void;
  fetchData: (showLoader?: boolean) => Promise<void>;
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>;
}

export function useBayDragHandlers({
  data,
  setData,
  setActiveDrag,
  markPending,
  clearPending,
  fetchData,
  setToast,
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

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    const activeData = active.data.current;
    const prevData = data;

    if (!over) {
      if (activeData?.type === "mechanic-assigned" && activeData.workOrderId) {
        const woId = activeData.workOrderId;
        markPending(woId);
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
                              mechanic: null,
                              mechanic_id: null,
                            }
                          : null,
                      }
                    : b,
                ),
              }
            : d,
        );
        try {
          await unassignMechanicFromWorkOrder(woId);
        } catch {
          setData(prevData);
        } finally {
          clearPending(woId);
          fetchData(false);
        }
      }
      return;
    }

    const overId = String(over.id);

    try {
      // Case 1: Dragging a vehicle to a bay
      if (activeData?.type === "vehicle" && overId.startsWith("bay-")) {
        const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
        const woId = activeData.workOrderId;
        markPending(woId);

        setData((d) => {
          if (!d) return d;
          const movedWO =
            d.waitingQueue.find((w) => w.id === woId) ??
            d.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
          if (!movedWO) return d;
          const enriched = {
            ...movedWO,
            bay_number: bayNumber,
            status: "Diagnosing" as const,
            mechanic: null,
            customer_name:
              ((movedWO as unknown as Record<string, unknown>).customer_name as
                | string
                | null) ?? null,
          };
          return {
            ...d,
            waitingQueue: d.waitingQueue.filter((w) => w.id !== woId),
            bays: d.bays.map((b) =>
              b.bayNumber === bayNumber
                ? { ...b, workOrder: enriched }
                : b.workOrder?.id === woId
                  ? { ...b, workOrder: null }
                  : b,
            ),
          };
        });

        await assignVehicleToBay(woId, bayNumber);
        clearPending(woId);
        fetchData(false);
        return;
      }

      // Case 2: Dragging vehicle from a bay back to waiting queue
      if (
        activeData?.type === "vehicle" &&
        (overId === "waiting-queue" || overId.startsWith("vehicle-")) &&
        data?.bays.some((b) => b.workOrder?.id === activeData.workOrderId)
      ) {
        const woId = activeData.workOrderId;
        const sourceBay = data?.bays.find((b) => b.workOrder?.id === woId);
        if (!sourceBay?.workOrder) return;

        markPending(woId);

        setData((d) => {
          if (!d) return d;
          const movedWO = sourceBay.workOrder;
          const cleaned = {
            ...movedWO,
            bay_number: null,
            status: "New" as const,
            mechanic: null,
            mechanic_id: null,
          } as unknown as WorkOrder & { vehicle: Vehicle | null };
          return {
            ...d,
            waitingQueue: [cleaned, ...d.waitingQueue],
            bays: d.bays.map((b) =>
              b.bayNumber === sourceBay.bayNumber
                ? { ...b, workOrder: null }
                : b,
            ),
          };
        });

        await removeVehicleFromBay(woId);
        clearPending(woId);
        fetchData(false);
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
            setToast({
              message: "Drop the vehicle here first, then assign a mechanic.",
              variant: "info",
            });
            return;
          }
        } else if (overId.startsWith("vehicle-")) {
          targetWoId = overId.replace("vehicle-", "");
        } else if (overId.startsWith("mechanic-on-wo-")) {
          targetWoId = overId.replace("mechanic-on-wo-", "");
        }

        if (targetWoId && activeData.mechanicId) {
          const mechId = activeData.mechanicId;
          const mechName =
            data?.mechanics.find((m) => m.id === mechId)?.full_name ?? null;
          markPending(targetWoId);

          setData((d) => {
            if (!d) return d;
            const nextBays = d.bays.map((b) => {
              const wo = b.workOrder;
              let next = b;
              if (wo && wo.mechanic?.id === mechId) {
                next = {
                  ...next,
                  workOrder: { ...wo, mechanic: null, mechanic_id: null },
                };
              }
              if (next.workOrder?.id === targetWoId && next.workOrder) {
                next = {
                  ...next,
                  workOrder: {
                    ...next.workOrder,
                    mechanic: {
                      id: mechId,
                      full_name: mechName,
                      avatar_url: null,
                    },
                    mechanic_id: mechId,
                    status: "In Progress" as const,
                  },
                };
              }
              return next;
            });
            return { ...d, bays: nextBays };
          });

          await assignMechanicToWorkOrder(targetWoId, mechId);
          clearPending(targetWoId);
          fetchData(false);
        }
        return;
      }

      // Case 4: Dragging an assigned mechanic to another bay
      if (activeData?.type === "mechanic-assigned") {
        const mechanicId = activeData.mechanicId;
        const currentWoId = activeData.workOrderId;
        if (!mechanicId) return;

        if (overId.startsWith("mechanic-")) {
          markPending(currentWoId);
          setData((d) =>
            d
              ? {
                  ...d,
                  bays: d.bays.map((b) =>
                    b.workOrder?.id === currentWoId
                      ? {
                          ...b,
                          workOrder: b.workOrder
                            ? {
                                ...b.workOrder,
                                mechanic: null,
                                mechanic_id: null,
                              }
                            : null,
                        }
                      : b,
                  ),
                }
              : d,
          );
          try {
            await unassignMechanicFromWorkOrder(currentWoId);
          } catch {
            setData(prevData);
          } finally {
            clearPending(currentWoId);
            fetchData(false);
          }
          return;
        }

        const findTargetWoId = (): string | null => {
          if (overId.startsWith("vehicle-")) {
            const newWoId = overId.replace("vehicle-", "");
            return newWoId !== currentWoId ? newWoId : null;
          }
          if (overId.startsWith("bay-")) {
            const bayNumber = Number.parseInt(overId.replace("bay-", ""), 10);
            const bay = data?.bays.find((b) => b.bayNumber === bayNumber);
            if (!bay?.workOrder) {
              setToast({
                message:
                  "Drop the vehicle here first, then reassign the mechanic.",
                variant: "info",
              });
              return null;
            }
            return bay.workOrder.id !== currentWoId ? bay.workOrder.id : null;
          }
          return null;
        };

        const targetWoId = findTargetWoId();
        if (!targetWoId) return;

        const mechName =
          data?.mechanics.find((m) => m.id === mechanicId)?.full_name ?? null;
        markPending(currentWoId, targetWoId);

        setData((d) => {
          if (!d) return d;
          const nextBays = d.bays.map((b) => {
            const wo = b.workOrder;
            let next = b;
            if (wo && wo.id === currentWoId) {
              next = {
                ...next,
                workOrder: { ...wo, mechanic: null, mechanic_id: null },
              };
            }
            if (next.workOrder?.id === targetWoId && next.workOrder) {
              next = {
                ...next,
                workOrder: {
                  ...next.workOrder,
                  mechanic: {
                    id: mechanicId,
                    full_name: mechName,
                    avatar_url: null,
                  },
                  mechanic_id: mechanicId,
                  status: "In Progress" as const,
                },
              };
            }
            return next;
          });
          return { ...d, bays: nextBays };
        });

        await assignMechanicToWorkOrder(targetWoId, mechanicId);
        clearPending(currentWoId, targetWoId);
        fetchData(false);
        return;
      }

      // Case 5: Reorder within waiting queue
      if (activeData?.type === "vehicle" && overId.startsWith("vehicle-")) {
        const activeWoId = activeData.workOrderId;
        const targetWoId = overId.replace("vehicle-", "");

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

          setData((d) => (d ? { ...d, waitingQueue: reordered } : d));

          await reorderQueue(updates);
          fetchData(false);
          return;
        }
      }
    } catch (err) {
      if (prevData) setData(prevData);
      const woIds = [activeData?.workOrderId].filter(Boolean);
      clearPending(...woIds);
      console.error("Drag action failed:", err);
      setToast({
        message: "Action failed — changes reverted",
        variant: "error",
      });
    }
  }

  return { handleDragStart, handleDragEnd };
}
