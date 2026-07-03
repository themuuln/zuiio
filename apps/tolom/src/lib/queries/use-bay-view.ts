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
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { BaySlotData, BayViewData } from "@/lib/services/bay-view-service";
import { bayViewKeys, workOrderKeys } from "./keys";

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
                // Preserve mechanic/helpers on bay→bay moves;
                // clear them only for queue→bay first assignments.
                // When sourceBayNumber != null, wo came from woFromBay
                // (has the enriched type with mechanic/helpers/customer).
                const isFromQueue = sourceBayNumber == null;
                const overrides = {
                  mechanic: isFromQueue
                    ? null
                    : (wo as NonNullable<typeof woFromBay>).mechanic,
                  helpers: isFromQueue
                    ? []
                    : (wo as NonNullable<typeof woFromBay>).helpers,
                  customer_name: isFromQueue
                    ? null
                    : (wo as NonNullable<typeof woFromBay>).customer_name,
                } as const;
                return {
                  ...b,
                  workOrder: {
                    ...wo,
                    bay_number: vars.bayNumber,
                    status: "New" as const,
                    ...overrides,
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
  });
}

// ─── Add Helper ────────────────────────────────────────────────

export function useAddHelperToWorkOrder(
  branchId: string | undefined,
  orgId?: string | undefined,
) {
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
    onSettled: (_data, _error, variables) => {
      // Invalidate drawer work order detail cache so both views stay in sync
      if (orgId && variables?.woId) {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId, variables.woId),
        });
      }
    },
  });
}

// ─── Remove Helper ─────────────────────────────────────────────

export function useRemoveHelperFromWorkOrder(
  branchId: string | undefined,
  orgId?: string | undefined,
) {
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
    onSettled: (_data, _error, variables) => {
      // Invalidate drawer work order detail cache so both views stay in sync
      if (orgId && variables?.woId) {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId, variables.woId),
        });
      }
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
      customerName: _customerName,
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
    onSettled: (_data, _error, vars) => {
      // Invalidate drawer work order detail cache so the drawer reflects the customer change
      if (orgId && vars?.woId) {
        queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId, vars.woId),
        });
      }
    },
  });
}

// ─── Batch Complete ────────────────────────────────────────────

/**
 * Complete all "Ready for Pickup" work orders at once.
 * Uses Promise.allSettled under the hood so partial success doesn't fail the batch.
 */
export function useBatchCompleteMutation(branchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workOrderIds: string[]) => {
      const { batchCompleteWorkOrders } = await import(
        "@/lib/services/bay-view-service.actions"
      );
      return batchCompleteWorkOrders(workOrderIds);
    },
    onMutate: async (workOrderIds) => {
      const key = bayViewKeys.data(branchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BayViewData>(key);

      if (previous) {
        const woIdSet = new Set(workOrderIds);
        queryClient.setQueryData<BayViewData>(key, {
          ...previous,
          bays: previous.bays.map((b) =>
            b.workOrder && woIdSet.has(b.workOrder.id)
              ? { ...b, workOrder: null }
              : b,
          ),
          branchSections: previous.branchSections?.map((section) => ({
            ...section,
            bays: section.bays.map((b) =>
              b.workOrder && woIdSet.has(b.workOrder.id)
                ? { ...b, workOrder: null }
                : b,
            ),
          })),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      rollbackOnError(queryClient, branchId, context);
      toast.error("Failed to complete all ready work orders");
    },
    onSuccess: (result) => {
      toast.dismiss();
      const readyCount = result.succeeded + result.failed;
      if (result.succeeded === readyCount) {
        toast.success(
          `Completed ${result.succeeded} work order${result.succeeded === 1 ? "" : "s"}`,
        );
      } else if (result.failed === readyCount) {
        toast.error("Failed to complete work orders — try again");
      } else {
        toast.error(
          `Completed ${result.succeeded} of ${readyCount}; ${result.failed} failed`,
        );
      }
    },
    onSettled: (_data, _error, workOrderIds) => {
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.data(branchId),
      });
      queryClient.invalidateQueries({
        queryKey: bayViewKeys.shiftReport(branchId),
      });
      // Invalidate work order detail caches so open drawers reflect completion
      for (const woId of workOrderIds ?? []) {
        queryClient.invalidateQueries({
          queryKey: ["workOrder", "detail", woId],
        });
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
