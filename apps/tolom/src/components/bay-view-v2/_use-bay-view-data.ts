"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFuzzySearch } from "@zuiio/hooks";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { bayViewKeys } from "@/lib/queries/keys";
import { useProfile } from "@/lib/queries/use-profile";
import type {
  BayViewData,
  ShiftReport,
} from "@/lib/services/bay-view-service";
import {
  getBayViewDataFresh,
  getShiftReport,
} from "@/lib/services/bay-view-service.actions";
import type { ActiveDragState, ViewMode } from "./_types";
import type { BayViewDialogsState } from "./_use-bay-view-dialogs";
import type { BayViewPendingState } from "./_use-bay-view-pending";

export function useBayViewData(
  orgId: string | undefined,
  branchFilter: string | undefined,
  dialogs: BayViewDialogsState,
  pending: BayViewPendingState,
) {
  const searchParams = useSearchParams();
  const woIdFromUrl = searchParams.get("woId");

  // ── UI state ─────────────────────────────────────────────────
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(!!woIdFromUrl);
  const [detailWoId, setDetailWoId] = useState<string | null>(woIdFromUrl);
  const [drawerInitialAction, setDrawerInitialAction] = useState<
    "add-service" | "add-part" | null
  >(null);
  const [emptyBayBayNumber, setEmptyBayBayNumber] = useState<number | null>(
    null,
  );
  const [directAssignBayNumber, setDirectAssignBayNumber] = useState<
    number | null
  >(null);
  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>(
    {},
  );
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [baySearchQuery, setBaySearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const markPending = useCallback((...ids: string[]) => {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) next[id] = true;
      return next;
    });
  }, []);

  const clearPending = useCallback((...ids: string[]) => {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) delete next[id];
      return next;
    });
  }, []);

  // ── Polling pause: pause background refetch when any surface is open ──
  const anySurfaceOpen = useMemo(
    () =>
      Object.values(dialogs.open).some(Boolean) ||
      pending.pending !== null ||
      detailDrawerOpen ||
      emptyBayBayNumber !== null ||
      directAssignBayNumber !== null,
    [
      dialogs.open,
      pending.pending,
      detailDrawerOpen,
      emptyBayBayNumber,
      directAssignBayNumber,
    ],
  );

  // ── Profile ──────────────────────────────────────────────────
  const { data: profileData } = useProfile();
  useEffect(() => {
    if (profileData?.id) {
      setCurrentProfile({
        id: profileData.id,
        full_name: profileData.fullName ?? null,
      });
    }
  }, [profileData?.id, profileData?.fullName]);

  // ── React Query ──────────────────────────────────────────────
  const bayQuery = useQuery({
    queryKey: bayViewKeys.data(branchFilter),
    queryFn: () => getBayViewDataFresh(branchFilter),
    staleTime: 60_000,
    refetchInterval: anySurfaceOpen ? false : 300_000,
  });

  const shiftQuery = useQuery({
    queryKey: bayViewKeys.shiftReport(branchFilter),
    queryFn: () => getShiftReport(branchFilter),
    staleTime: 60_000,
    refetchInterval: anySurfaceOpen ? false : 300_000,
  });

  const data = bayQuery.data ?? null;
  const shiftReport = shiftQuery.data ?? null;
  const loading = bayQuery.isLoading;
  const error =
    bayQuery.error instanceof Error ? bayQuery.error.message : null;

  const fetchData = useCallback(async () => {
    await bayQuery.refetch();
    await shiftQuery.refetch();
  }, [bayQuery, shiftQuery]);

  // ── Derived data ─────────────────────────────────────────────
  const readyWosCount = useMemo(
    () =>
      data?.bays.filter((b) => b.workOrder?.status === "Ready for Pickup")
        .length ?? 0,
    [data],
  );

  const userIsMechanic =
    currentProfile &&
    data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = useMemo(() => {
    const bays = myJobsOnly
      ? (data?.bays.map((bay) => {
          if (!bay.workOrder) return bay;
          const isMain =
            bay.workOrder.mechanic?.id === currentProfile?.id;
          const isHelper =
            bay.workOrder.helpers?.some(
              (h) => h.id === currentProfile?.id,
            ) ?? false;
          return {
            ...bay,
            workOrder: isMain || isHelper ? bay.workOrder : null,
          };
        }) ?? [])
      : (data?.bays ?? []);

    if (statusFilter) {
      return bays.filter(
        (bay) => !bay.workOrder || bay.workOrder.status === statusFilter,
      );
    }
    return bays;
  }, [data, myJobsOnly, currentProfile?.id, statusFilter]);

  const filteredQueue = useMemo(() => data?.waitingQueue ?? [], [data]);

  // ── Shift report trend ────────────────────────────────────────
  const prevShiftReportRef = useRef<ShiftReport | null>(null);
  useEffect(() => {
    if (shiftReport) prevShiftReportRef.current = shiftReport;
  }, [shiftReport]);

  const prevShiftReport = prevShiftReportRef.current;
  const trendDelta =
    shiftReport && prevShiftReport
      ? {
          bayUtilization:
            shiftReport.bayUtilization - prevShiftReport.bayUtilization,
          activeJobs: shiftReport.activeJobs - prevShiftReport.activeJobs,
          completedToday:
            shiftReport.completedToday - prevShiftReport.completedToday,
          revenueToday:
            shiftReport.revenueToday - prevShiftReport.revenueToday,
          revenuePerLaborHour:
            shiftReport.revenuePerLaborHour -
            prevShiftReport.revenuePerLaborHour,
        }
      : null;

  // ── Search ────────────────────────────────────────────────────
  const searchedBranchSections = useMemo(() => {
    if (!data?.branchSections) return undefined;
    if (!baySearchQuery.trim()) return data.branchSections;
    const q = baySearchQuery.toLowerCase();
    return data.branchSections.map((section) => ({
      ...section,
      bays: section.bays.filter((b) => {
        const wo = b.workOrder;
        if (!wo?.vehicle) return false;
        return (
          wo.vehicle.plate_number?.toLowerCase().includes(q) ||
          wo.vehicle.make?.toLowerCase().includes(q) ||
          wo.vehicle.model?.toLowerCase().includes(q)
        );
      }),
    }));
  }, [data?.branchSections, baySearchQuery]);

  const searchedBays = useFuzzySearch(filteredBays, baySearchQuery, {
    keys: [
      "workOrder.vehicle.plate_number" as string,
      "workOrder.vehicle.make" as string,
      "workOrder.vehicle.model" as string,
      "workOrder.customer_name" as string,
      "workOrder.mechanic.full_name" as string,
      "workOrder.status" as string,
    ],
    threshold: 0.4,
  });

  // ── Realtime subscriptions ──────────────────────────────────
  const realtimeTables = useMemo(
    () => [
      {
        table: "work_orders" as const,
        queryKey: bayViewKeys.data(branchFilter),
        filter: branchFilter
          ? `organization_id=eq.${orgId},branch_id=eq.${branchFilter}`
          : `organization_id=eq.${orgId}`,
      },
      {
        table: "work_order_helpers" as const,
        queryKey: bayViewKeys.data(branchFilter),
        filter: `organization_id=eq.${orgId}`,
      },
      {
        table: "mechanic_assignments" as const,
        queryKey: bayViewKeys.data(branchFilter),
        filter: `organization_id=eq.${orgId}`,
      },
    ],
    [branchFilter, orgId],
  );

  useRealtimeMulti({
    enabled: !!orgId && !anySurfaceOpen,
    tables: realtimeTables,
  });

  const occupiedBays = useMemo(
    () => data?.bays.filter((b) => b.workOrder).length ?? 0,
    [data],
  );

  return {
    // Data
    data,
    shiftReport,
    loading,
    error,
    fetchData,
    // UI state
    myJobsOnly,
    setMyJobsOnly,
    viewMode,
    setViewMode,
    baySearchQuery,
    setBaySearchQuery,
    statusFilter,
    setStatusFilter,
    detailDrawerOpen,
    setDetailDrawerOpen,
    detailWoId,
    setDetailWoId,
    drawerInitialAction,
    setDrawerInitialAction,
    emptyBayBayNumber,
    setEmptyBayBayNumber,
    directAssignBayNumber,
    setDirectAssignBayNumber,
    pendingWoIds,
    setPendingWoIds,
    markPending,
    clearPending,
    activeDrag,
    setActiveDrag,
    // Computed
    readyWosCount,
    filteredBays,
    filteredQueue,
    searchedBays,
    searchedBranchSections,
    trendDelta,
    userIsMechanic,
    occupiedBays,
    currentProfile,
    branchFilter,
  };
}
