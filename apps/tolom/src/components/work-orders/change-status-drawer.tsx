"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { inventoryKeys, workOrderKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { WorkOrderListItem } from "@/lib/queries/use-work-orders";
import { cn } from "@/lib/utils";

// ─── Status config ────────────────────────────────────────────

const STATUS_FLOW = [
  { key: "New", label: "statusNew" },
  { key: "Diagnosing", label: "statusDiagnosing" },
  { key: "In Progress", label: "statusInProgress" },
  { key: "Ready for Pickup", label: "statusReadyForPickup" },
  { key: "Completed", label: "statusCompleted" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  New: "bg-info/15 text-info border-info/30",
  Diagnosing: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  "In Progress": "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "Ready for Pickup": "bg-green-500/15 text-green-500 border-green-500/30",
  Completed: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  Cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
};

// ─── Props ────────────────────────────────────────────────────

interface ChangeStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  currentStatus: string;
}

// ─── Cache helpers ────────────────────────────────────────────

/** Snapshot all work-order list caches for optimistic rollback. */
function snapshotListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
): Map<string, WorkOrderListItem[]> {
  const snap = new Map<string, WorkOrderListItem[]>();
  const queries = queryClient.getQueriesData<WorkOrderListItem[]>({
    queryKey: workOrderKeys.all(orgId),
  });
  for (const [key, data] of queries) {
    if (Array.isArray(data)) snap.set(JSON.stringify(key), data);
  }
  return snap;
}

/** Update the matching work order's status in every active cache. */
function applyOptimisticStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
  woId: string,
  newStatus: string,
) {
  const queries = queryClient.getQueriesData({
    queryKey: workOrderKeys.all(orgId),
  });
  for (const [key, data] of queries) {
    if (!Array.isArray(data)) continue;
    queryClient.setQueryData(key, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((wo: Record<string, unknown>) =>
        wo.id === woId ? { ...wo, status: newStatus } : wo,
      );
    });
  }
}

/** Restore all list caches from a snapshot. */
function restoreSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: Map<string, WorkOrderListItem[]>,
) {
  for (const [keyStr, data] of snapshot) {
    queryClient.setQueryData<WorkOrderListItem[]>(JSON.parse(keyStr), data);
  }
}

// ─── Component ────────────────────────────────────────────────

export function ChangeStatusDrawer({
  open,
  onOpenChange,
  workOrderId,
  currentStatus,
}: ChangeStatusSheetProps) {
  const t = useTranslations("workOrders") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const queryClient = useQueryClient();
  const { data: orgData } = useCurrentOrg();
  const orgId = orgData?.orgId;
  const snapshotRef = useRef<Map<string, WorkOrderListItem[]>>(new Map());

  const updateStatus = useMutation({
    mutationFn: async (vars: { woId: string; status: string }) => {
      if (!orgId) throw new Error("No organization");
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${vars.woId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: vars.status }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message ?? `Failed (${res.status})`);
      }
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as { status: string };
    },
    onSuccess: (_data, variables) => {
      // Invalidate inventory caches when WO is completed
      if (variables.status === "Completed" && orgId) {
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.balances(orgId),
        });
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.movements(orgId),
        });
      }
      // Invalidate work order list caches so server data syncs after confirmation
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.all(orgId ?? ""),
      });
      toast.dismiss();
      toast.success(`${t("statusChanged")}: ${t(`status${variables.status}`)}`);
      onOpenChange(false);
    },
    onError: (error) => {
      // Restore optimistically updated list caches
      restoreSnapshots(queryClient, snapshotRef.current);
      toast.dismiss();
      toast.error(error.message);
    },
  });

  const handleChange = (newStatus: string) => {
    if (!orgId) return;

    // Snapshot current list caches for rollback on failure
    snapshotRef.current = snapshotListCaches(queryClient, orgId);

    // Optimistic UI — update list caches immediately, no invalidation
    applyOptimisticStatus(queryClient, orgId, workOrderId, newStatus);

    updateStatus.mutate({ woId: workOrderId, status: newStatus });
  };

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("changeStatus")}</DetailDrawer.Title>
        <DetailDrawer.Description>
          <span className="font-mono">#{workOrderId.slice(0, 8)}</span>
          {" — "}
          {t("currentStatus")}:{" "}
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center rounded-md border px-1.5 text-[11px] font-medium",
              STATUS_COLORS[currentStatus] ??
                "bg-gray-500/15 text-gray-500 border-gray-500/30",
            )}
          >
            {currentStatus}
          </span>
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body className="flex flex-col gap-1">
        {STATUS_FLOW.map(({ key, label }) => {
          const isCurrent = key === currentStatus;
          const isPending = updateStatus.isPending;
          return (
            <button
              key={key}
              type="button"
              disabled={isCurrent || isPending}
              onClick={() => handleChange(key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-[color,background-color,border-color] duration-200",
                isCurrent
                  ? "border-primary/40 bg-primary/5 cursor-default"
                  : "border-border bg-background hover:border-primary/30 hover:bg-muted/50 cursor-pointer",
                isPending && !isCurrent && "opacity-50",
              )}
            >
              {/* Color dot */}
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  STATUS_COLORS[key]?.split(" ")[0] ?? "bg-gray-500/15",
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  "flex-1 font-medium",
                  isCurrent && "text-primary",
                )}
              >
                {t(label)}
              </span>

              {/* Checkmark for current status */}
              {isCurrent && (
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </DetailDrawer.Body>
    </DetailDrawer>
  );
}
