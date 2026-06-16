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
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
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

// ─── Branch Sections Helper ───────────────────────────────────
/**
 * Apply `updater` to both `data.bays` and every nested bay inside
 * `data.branchSections`. This keeps the optimistic cache in sync when
 * the user is viewing "All" branches (where the UI reads from branchSections).
 */
function updateBaysInData(
  data: BayViewData,
  updater: (bay: BaySlotData) => BaySlotData,
): BayViewData {
  return {
    ...data,
    bays: data.bays.map(updater),
    branchSections: data.branchSections?.map((section) => ({
      ...section,
      bays: section.bays.map(updater),
    })),
  };
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
        "@/lib/services/bay-view-service.actions"
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
        queryClient.setQueryData<BayViewData>(
          key,
          updateBaysInData(previous, (b) =>
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
        );
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
        "@/lib/services/bay-view-service.actions"
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
          queryClient.setQueryData<BayViewData>(key, (prev) => {
            if (!prev) return prev;
            return {
              ...updateBaysInData(prev, (b) =>
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
              waitingQueue: prev.waitingQueue.filter(
                (w) => w.id !== vars.workOrderId,
              ),
            };
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
  });
}

// ─── Remove from Bay ───────────────────────────────────────────

export function useRemoveVehicleFromBay(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ woId }: { woId: string }) => {
      const { removeVehicleFromBay } = await import(
        "@/lib/services/bay-view-service.actions"
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
          queryClient.setQueryData<BayViewData>(key, (prev) => {
            if (!prev) return prev;
            return {
              ...updateBaysInData(prev, (b) =>
                b.workOrder?.id === vars.woId ? { ...b, workOrder: null } : b,
              ),
              waitingQueue: [
                ...prev.waitingQueue,
                { ...removedWO, bay_number: null, status: "New" as const },
              ],
            };
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
  });
}

// ─── Assign Mechanic ────────────────────────────────────────────

export function useAssignMechanicToWorkOrder(_branchId: string | undefined) {
  return useMutation({
    mutationFn: async ({
      woId,
      mechanicId,
    }: {
      woId: string;
      mechanicId: string;
    }) => {
      const { assignMechanicToWorkOrder } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await assignMechanicToWorkOrder(woId, mechanicId);
    },
    onError: () => {
      toast.error("Failed to assign mechanic");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Mechanic assigned");
    },
  });
}

// ─── Remove Mechanic ───────────────────────────────────────────

export function useRemoveMechanicFromWorkOrder(_branchId: string | undefined) {
  return useMutation({
    mutationFn: async ({ woId }: { woId: string }) => {
      const { unassignMechanicFromWorkOrder } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await unassignMechanicFromWorkOrder(woId);
    },
    onError: () => {
      toast.error("Failed to remove mechanic");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Mechanic removed");
    },
  });
}

// ─── Add Helper ────────────────────────────────────────────────

export function useAddHelperToWorkOrder(_branchId: string | undefined) {
  return useMutation({
    mutationFn: async ({
      woId,
      mechanicId,
    }: {
      woId: string;
      mechanicId: string;
    }) => {
      const { assignHelperToWorkOrder } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await assignHelperToWorkOrder(woId, mechanicId);
    },
    onError: () => {
      toast.error("Failed to add helper");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Helper added");
    },
  });
}

// ─── Remove Helper ─────────────────────────────────────────────

export function useRemoveHelperFromWorkOrder(_branchId: string | undefined) {
  return useMutation({
    mutationFn: async ({
      woId,
      mechanicId,
    }: {
      woId: string;
      mechanicId: string;
    }) => {
      const { removeHelperFromWorkOrder } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await removeHelperFromWorkOrder(woId, mechanicId);
    },
    onError: () => {
      toast.error("Failed to remove helper");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Helper removed");
    },
  });
}

// ─── Assign Customer ───────────────────────────────────────────

export function useAssignCustomerToWorkOrder(
  branchId: string | undefined,
  orgId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woId,
      customerId,
      customerName,
    }: {
      woId: string;
      customerId: string | null;
      customerName?: string | null;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${woId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customerId }),
        },
      );
      const json = await res.json();
      if (json.error)
        throw new Error(json.error.message ?? "Failed to assign customer");
      return json.data;
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);
      if (previous) {
        queryClient.setQueryData<BayViewData>(
          key,
          updateBaysInData(previous, (b) =>
            b.workOrder?.id === vars.woId && b.workOrder
              ? {
                  ...b,
                  workOrder: {
                    ...b.workOrder,
                    customer_name: vars.customerName ?? null,
                  },
                }
              : b,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to assign customer");
    },
    onSuccess: (_, vars) => {
      toast.dismiss();
      if (vars.customerId) {
        toast.success("Customer assigned");
      }
    },
  });
}

// ─── Bay Count ─────────────────────────────────────────────────

export function useUpdateBayCount(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ count }: { count: number }) => {
      const { updateBayCount } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await updateBayCount(count);
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);
      if (previous) {
        const newBays = Array.from({ length: vars.count }, (_, i) => {
          const existing = previous.bays[i];
          return existing ?? { bayNumber: i + 1, workOrder: null };
        });
        queryClient.setQueryData<BayViewData>(key, {
          ...previous,
          bayCount: vars.count,
          bays: newBays,
          branchSections: previous.branchSections?.map((section) => ({
            ...section,
            bayCount: vars.count,
            bays: Array.from({ length: vars.count }, (_, i) => {
              const existing = section.bays[i];
              return existing ?? { bayNumber: i + 1, workOrder: null };
            }),
          })),
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
