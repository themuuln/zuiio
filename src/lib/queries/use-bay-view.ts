/**
 * React Query hooks for bay view data.
 * Replaces direct service calls + useState with cached mutations.
 *
 * NOTE: useOrgMutation factory is designed for list mutations (TData[]).
 * Bay view data is a single BayViewData object, so these hooks use
 * useMutation directly with the optimistic update + rollback pattern.
 */
"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
import { bayViewKeys } from "./keys";

// ─── Optimistic Update Helper ─────────────────────────────────

/**
 * Cancel in-flight queries, snapshot current data, apply optimistic update,
 * and return the snapshot for rollback in `onError`.
 */
async function applyBayViewOptimistic(
  queryClient: QueryClient,
  branchId: string | undefined,
  updateFn: (data: BayViewData) => BayViewData,
): Promise<{ previous: BayViewData | undefined }> {
  const key = bayViewKeys.data(branchId);
  await queryClient.cancelQueries({ queryKey: key });
  const previous = queryClient.getQueryData<BayViewData>(key);
  if (previous) {
    queryClient.setQueryData<BayViewData>(key, updateFn(previous));
  }
  return { previous };
}

// ─── Rollback Helper ──────────────────────────────────────────

function rollbackOnError(
  queryClient: QueryClient,
  branchId: string | undefined,
  context: { previous: BayViewData | undefined } | undefined,
) {
  if (context?.previous) {
    queryClient.setQueryData(bayViewKeys.data(branchId), context.previous);
  }
}

// ─── Mechanic Lookup Helper ───────────────────────────────────

function lookupMechanic(
  mechanics: BayViewData["mechanics"],
  mechanicId: string,
): { full_name: string | null; avatar_url: string | null } {
  const m = mechanics.find((m) => m.id === mechanicId);
  return { full_name: m?.full_name ?? null, avatar_url: m?.avatar_url ?? null };
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
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) =>
        updateBaysInData(data, (b) =>
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
      ),
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

      // Find the WO — it may be in the waiting queue OR already in a bay (reassign)
      const woFromQueue = previous?.waitingQueue.find(
        (w) => w.id === vars.workOrderId,
      );
      const woFromBay = previous?.bays.find(
        (b) => b.workOrder?.id === vars.workOrderId,
      )?.workOrder;
      const wo = woFromQueue ?? woFromBay;

      if (previous && wo) {
        // Track source bay so we can clear it in the bay-to-bay case
        const sourceBayNumber = previous.bays.find(
          (b) => b.workOrder?.id === vars.workOrderId,
        )?.bayNumber;

        queryClient.setQueryData<BayViewData>(key, (prev) => {
          if (!prev) return prev;
          return {
            ...updateBaysInData(prev, (b) => {
              // Clear source bay if this is a bay-to-bay reassignment
              if (
                sourceBayNumber != null &&
                sourceBayNumber !== vars.bayNumber &&
                b.bayNumber === sourceBayNumber
              ) {
                return { ...b, workOrder: null };
              }
              // Set the WO in the target bay
              if (b.bayNumber === vars.bayNumber) {
                return {
                  ...b,
                  workOrder: {
                    ...wo,
                    bay_number: vars.bayNumber,
                    status: "New" as const,
                    mechanic: null,
                    helpers: [],
                    customer_name: null,
                  },
                };
              }
              return b;
            }),
            waitingQueue: prev.waitingQueue.filter(
              (w) => w.id !== vars.workOrderId,
            ),
          };
        });
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
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
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
      const removedWO = previous?.bays.find(
        (b) => b.workOrder?.id === vars.woId,
      )?.workOrder;
      if (previous && removedWO) {
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
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
    },
  });
}

// ─── Swap Bays ────────────────────────────────────────────────

export function useSwapBays(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      woIdA,
      bayNumberA,
      woIdB,
      bayNumberB,
    }: {
      woIdA: string;
      bayNumberA: number;
      woIdB: string;
      bayNumberB: number;
    }) => {
      const { swapBayNumbers } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await swapBayNumbers(woIdA, bayNumberA, woIdB, bayNumberB);
    },
    onMutate: async (vars) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);

      if (previous) {
        const woA = previous.bays.find(
          (b) => b.workOrder?.id === vars.woIdA,
        )?.workOrder;
        const woB = previous.bays.find(
          (b) => b.workOrder?.id === vars.woIdB,
        )?.workOrder;

        if (woA && woB) {
          queryClient.setQueryData<BayViewData>(key, (prev) => {
            if (!prev) return prev;
            return {
              ...updateBaysInData(prev, (b) => {
                if (b.bayNumber === vars.bayNumberA) {
                  return {
                    ...b,
                    workOrder: { ...woB, bay_number: vars.bayNumberA },
                  };
                }
                if (b.bayNumber === vars.bayNumberB) {
                  return {
                    ...b,
                    workOrder: { ...woA, bay_number: vars.bayNumberB },
                  };
                }
                return b;
              }),
            };
          });
        }
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to swap bays");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Bays swapped");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
    },
  });
}

// ─── Assign Mechanic ────────────────────────────────────────────

export function useAssignMechanicToWorkOrder(branchId: string | undefined) {
  const queryClient = useQueryClient();

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
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) => {
        const mechanic = lookupMechanic(data.mechanics, vars.mechanicId);
        return updateBaysInData(data, (b) => {
          let bay = b;
          // If mechanic was assigned elsewhere, clear them from that bay
          if (bay.workOrder?.mechanic?.id === vars.mechanicId) {
            bay = {
              ...bay,
              workOrder: bay.workOrder
                ? { ...bay.workOrder, mechanic: null, mechanic_id: null }
                : null,
            };
          }
          // Assign mechanic to target work order
          if (bay.workOrder?.id === vars.woId && bay.workOrder) {
            bay = {
              ...bay,
              workOrder: {
                ...bay.workOrder,
                mechanic: { id: vars.mechanicId, ...mechanic },
                mechanic_id: vars.mechanicId,
                status: "In Progress" as const,
              },
            };
          }
          return bay;
        });
      }),
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to assign mechanic");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Mechanic assigned");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
    },
  });
}

// ─── Remove Mechanic ───────────────────────────────────────────

export function useRemoveMechanicFromWorkOrder(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ woId }: { woId: string }) => {
      const { unassignMechanicFromWorkOrder } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      await unassignMechanicFromWorkOrder(woId);
    },
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) =>
        updateBaysInData(data, (b) =>
          b.workOrder?.id === vars.woId && b.workOrder
            ? {
                ...b,
                workOrder: {
                  ...b.workOrder,
                  mechanic: null,
                  mechanic_id: null,
                },
              }
            : b,
        ),
      ),
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to remove mechanic");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Mechanic removed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
    },
  });
}

// ─── Add Helper ────────────────────────────────────────────────

export function useAddHelperToWorkOrder(branchId: string | undefined) {
  const queryClient = useQueryClient();

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
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) => {
        const mechanic = lookupMechanic(data.mechanics, vars.mechanicId);
        return updateBaysInData(data, (b) => {
          if (b.workOrder?.id !== vars.woId || !b.workOrder) return b;
          if (b.workOrder.helpers.some((h) => h.id === vars.mechanicId))
            return b;
          if (b.workOrder.mechanic?.id === vars.mechanicId) return b;
          return {
            ...b,
            workOrder: {
              ...b.workOrder,
              helpers: [
                ...b.workOrder.helpers,
                { id: vars.mechanicId, ...mechanic },
              ],
            },
          };
        });
      }),
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to add helper");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Helper added");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
    },
  });
}

// ─── Remove Helper ─────────────────────────────────────────────

export function useRemoveHelperFromWorkOrder(branchId: string | undefined) {
  const queryClient = useQueryClient();

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
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) =>
        updateBaysInData(data, (b) =>
          b.workOrder?.id === vars.woId && b.workOrder
            ? {
                ...b,
                workOrder: {
                  ...b.workOrder,
                  helpers: b.workOrder.helpers.filter(
                    (h) => h.id !== vars.mechanicId,
                  ),
                },
              }
            : b,
        ),
      ),
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to remove helper");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Helper removed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
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
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) =>
        updateBaysInData(data, (b) =>
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
      ),
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
    onMutate: (vars) =>
      applyBayViewOptimistic(queryClient, branchId, (data) => ({
        ...data,
        bayCount: vars.count,
        bays: Array.from({ length: vars.count }, (_, i) => {
          const existing = data.bays[i];
          return existing ?? { bayNumber: i + 1, workOrder: null };
        }),
        branchSections: data.branchSections?.map((section) => ({
          ...section,
          bayCount: vars.count,
          bays: Array.from({ length: vars.count }, (_, i) => {
            const existing = section.bays[i];
            return existing ?? { bayNumber: i + 1, workOrder: null };
          }),
        })),
      })),
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
