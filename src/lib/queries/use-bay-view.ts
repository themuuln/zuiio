/**
 * React Query hooks for bay view data.
 * Replaces direct service calls + useState with cached mutations.
 *
 * NOTE: useOrgMutation factory is designed for list mutations (TData[]).
 * Bay view data is a single BayViewData object, so these hooks use
 * useMutation directly with the optimistic update + rollback pattern.
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BayViewData } from "@/lib/services/bay-view-service";
import { bayViewKeys } from "./keys";

// ─── Rollback Helper ──────────────────────────────────────────

function rollbackOnError(
  queryClient: ReturnType<typeof useQueryClient>,
  branchId: string | undefined,
  context: { previous: BayViewData | undefined } | undefined,
) {
  if (context?.previous) {
    queryClient.setQueryData(bayViewKeys.data(branchId), context.previous);
  }
}

// ─── Status Update ─────────────────────────────────────────────

export function useUpdateBayViewStatus(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woId,
      status,
      notes,
    }: {
      woId: string;
      status: string;
      notes?: string;
    }) => {
      const { updateWorkOrderStatus } = await import(
        "@/lib/services/bay-view-service"
      );
      await updateWorkOrderStatus(
        woId,
        status as "Ready for Pickup" | "Completed",
        notes,
      );
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);
      if (previous) {
        queryClient.setQueryData<BayViewData>(key, {
          ...previous,
          bays: previous.bays.map((b) =>
            b.workOrder?.id === vars.woId
              ? {
                  ...b,
                  workOrder: b.workOrder
                    ? {
                        ...b.workOrder,
                        status: vars.status as typeof b.workOrder.status,
                        bay_number:
                          vars.status === "Completed" ||
                          vars.status === "Cancelled"
                            ? null
                            : b.workOrder.bay_number,
                      }
                    : null,
                }
              : b,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to update status");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Status updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bayViewKeys.data(branchId) });
    },
  });
}

// ─── Assign to Bay ─────────────────────────────────────────────

export function useAssignVehicleToBay(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workOrderId,
      bayNumber,
    }: {
      workOrderId: string;
      bayNumber: number;
    }) => {
      const { assignVehicleToBay } = await import(
        "@/lib/services/bay-view-service"
      );
      await assignVehicleToBay(workOrderId, bayNumber);
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);
      if (previous) {
        const wo = previous.waitingQueue.find((w) => w.id === vars.workOrderId);
        if (wo) {
          queryClient.setQueryData<BayViewData>(key, {
            ...previous,
            waitingQueue: previous.waitingQueue.filter(
              (w) => w.id !== vars.workOrderId,
            ),
            bays: previous.bays.map((b) =>
              b.bayNumber === vars.bayNumber
                ? {
                    ...b,
                    workOrder: {
                      ...wo,
                      bay_number: vars.bayNumber,
                      status: "New" as const,
                      mechanic: null,
                      helpers: [],
                      customer_name: null,
                    },
                  }
                : b,
            ),
          });
        }
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to assign to bay");
    },
    onSuccess: (_data, vars) => {
      toast.dismiss();
      toast.success(`Assigned to Bay ${vars.bayNumber}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bayViewKeys.data(branchId) });
    },
  });
}

// ─── Remove from Bay ───────────────────────────────────────────

export function useRemoveVehicleFromBay(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ woId }: { woId: string }) => {
      const { removeVehicleFromBay } = await import(
        "@/lib/services/bay-view-service"
      );
      await removeVehicleFromBay(woId);
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);
      if (previous) {
        const removedWO = previous.bays.find(
          (b) => b.workOrder?.id === vars.woId,
        )?.workOrder;
        if (removedWO) {
          queryClient.setQueryData<BayViewData>(key, {
            ...previous,
            bays: previous.bays.map((b) =>
              b.workOrder?.id === vars.woId ? { ...b, workOrder: null } : b,
            ),
            waitingQueue: [
              ...previous.waitingQueue,
              { ...removedWO, bay_number: null, status: "New" as const },
            ],
          });
        }
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to remove from bay");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Removed from bay");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bayViewKeys.data(branchId) });
    },
  });
}

// ─── Bay Count ─────────────────────────────────────────────────

export function useUpdateBayCount(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ count }: { count: number }) => {
      const { updateBayCount } = await import(
        "@/lib/services/bay-view-service"
      );
      await updateBayCount(count);
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);
      if (previous) {
        queryClient.setQueryData<BayViewData>(key, {
          ...previous,
          bayCount: vars.count,
          bays: Array.from({ length: vars.count }, (_, i) => {
            const existing = previous.bays[i];
            return existing ?? { bayNumber: i + 1, workOrder: null };
          }),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to update bay count");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Bay count updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bayViewKeys.data(branchId) });
    },
  });
}
