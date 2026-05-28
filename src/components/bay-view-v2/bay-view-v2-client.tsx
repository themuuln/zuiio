"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Car,
  Columns3,
  GripVertical,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  List,
  Minus,
  Plus,
  RefreshCw,
  Users,
  Wrench,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";
import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { Vehicle, WorkOrder } from "@/lib/types";
import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  assignVehicleToBay,
  getBayViewDataFresh,
} from "@/lib/services/bay-view-service";
import { cn, formatPlateNumber } from "@/lib/utils";
import { AssignDialog } from "./assign-dialog";
import { BayCard } from "./bay-card";
import { MechanicPanel } from "./mechanic-panel";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import { PinSettingsDialog } from "./pin-settings-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import { QueuePanel } from "./queue-panel";
import { ShiftReportDialog } from "./shift-report-dialog";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { Typography } from "@/components/ui/typography";

type ViewMode = "grid" | "kanban" | "list";

function shouldIgnoreDragActivation(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest(
    '[data-no-dnd="true"], button, a, input, textarea, select',
  );
}

class GuardedPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: React.PointerEvent) =>
        !shouldIgnoreDragActivation(nativeEvent.target),
    },
  ];
}

class GuardedTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: React.TouchEvent) =>
        !shouldIgnoreDragActivation(nativeEvent.target),
    },
  ];
}

const VIEW_OPTIONS: {
  mode: ViewMode;
  icon: typeof LayoutGrid;
  labelKey: string;
}[] = [
  { mode: "grid", icon: LayoutGrid, labelKey: "gridView" },
  { mode: "kanban", icon: Columns3, labelKey: "kanbanView" },
  { mode: "list", icon: List, labelKey: "listView" },
];

interface ToastState {
  message: string;
  variant: "info" | "error";
}

export function BayViewV2Client() {
  const t = useTranslations("bayView");
  const [data, setData] = useState<BayViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: string;
    label: string;
  } | null>(null);
  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const woIdFromUrl = searchParams.get("woId");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(!!woIdFromUrl);
  const [detailWoId, setDetailWoId] = useState<string | null>(woIdFromUrl);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    woId: string;
    status: string;
  } | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [assignBay, setAssignBay] = useState<number | null>(null);
  const bayCountMutationInFlightRef = useRef(false);
  const [bayCountPending, setBayCountPending] = useState(false);
  const [bayCountInputValue, setBayCountInputValue] = useState<number | string>(
    "",
  );
  const bayCountDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Dialog open states
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [showPinSettings, setShowPinSettings] = useState(false);
  const [showVehicleReg, setShowVehicleReg] = useState(false);
  const [showMechanicReg, setShowMechanicReg] = useState(false);

  // Post-service / pickup intercept state
  const [pendingPostService, setPendingPostService] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    currentOdometer: number | null;
    newStatus: string;
    totalCost: number;
  } | null>(null);

  const [pendingPickupComplete, setPendingPickupComplete] = useState<{
    woId: string;
    vehicleId: string;
    vehiclePlate: string;
    newStatus: string;
    totalCost: number;
  } | null>(null);

  const { registerTab, unregisterTab } = useRightSidebar();
  const [toast, setToast] = useState<ToastState | null>(null);
  const bayCountValueRef = useRef(data?.bayCount ?? 0);

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

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      setError(null);
      const result = await getBayViewDataFresh();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    fetchData(true);

    fetch("/api/profile", { signal: abort.signal })
      .then((r) => r.json())
      .then((d) => {
        if (abort.signal.aborted) return;
        const profile = d?.profile ?? d?.data;
        if (profile?.id) {
          setCurrentProfile({
            id: profile.id,
            full_name: profile.full_name ?? null,
          });
        }
      })
      .catch(() => {});

    const interval = setInterval(() => fetchData(false), 30000);
    return () => {
      abort.abort();
      clearInterval(interval);
    };
  }, [fetchData]);

  useEffect(() => {
    if (data) bayCountValueRef.current = data.bayCount;
  }, [data?.bayCount]);

  useEffect(() => {
    if (data) setBayCountInputValue(data.bayCount);
  }, [data?.bayCount]);

  const pointerSensor = useSensor(GuardedPointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(GuardedTouchSensor, {
    activationConstraint: { delay: 300, tolerance: 20 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const { handleDragStart, handleDragEnd } = useBayDragHandlers({
    data,
    setData,
    setActiveDrag,
    markPending,
    clearPending,
    fetchData,
    setToast,
  });

  function onDragStart(event: Parameters<typeof handleDragStart>[0]) {
    handleDragStart(event);
    const activeData = event.active.data.current;
    if (activeData?.type === "vehicle" && activeData.workOrderId) {
      const id = activeData.workOrderId;
      const wo =
        data?.waitingQueue.find((w) => w.id === id) ??
        data?.bays.find((b) => b.workOrder?.id === id)?.workOrder;
      const plate = wo?.vehicle?.plate_number;
      if (plate) {
        setActiveDrag({
          type: "vehicle",
          label: formatPlateNumber(plate),
        });
      }
    } else if (
      (activeData?.type === "mechanic" && activeData.mechanicId) ||
      (activeData?.type === "mechanic-assigned" && activeData.mechanicId)
    ) {
      const mechId = activeData.mechanicId;
      const mech = data?.mechanics.find((m) => m.id === mechId);
      if (mech?.full_name) {
        setActiveDrag({
          type: "mechanic",
          label: mech.full_name,
        });
      }
    }
  }

  function onDragEnd(event: Parameters<typeof handleDragEnd>[0]) {
    handleDragEnd(event);
  }

  const {
    handleStatusClick: rawHandleStatusClick,
    handleStatusChangeConfirm,
    handleRemoveFromBay,
    handleBayCountChange,
  } = useBayActionHandlers({
    data,
    setData,
    setPendingStatusChange,
    markPending,
    clearPending,
    fetchData,
    setToast,
  });

  const applyBayCountChange = useCallback(
    async (next: number) => {
      if (next === data?.bayCount) return;
      if (bayCountMutationInFlightRef.current) return;
      if (bayCountDebounceRef.current) {
        clearTimeout(bayCountDebounceRef.current);
        bayCountDebounceRef.current = null;
      }
      bayCountMutationInFlightRef.current = true;
      bayCountValueRef.current = next;
      setBayCountPending(true);
      try {
        await handleBayCountChange(next);
        await fetchData(false);
      } finally {
        bayCountMutationInFlightRef.current = false;
        setBayCountPending(false);
      }
    },
    [data?.bayCount, fetchData, handleBayCountChange],
  );

  // Intercept status clicks — open PostServiceDialog for "Ready for Pickup"
  // and PickupCompleteDialog for "Completed"
  function handleStatusClick(woId: string, status: string) {
    // Find the work order in current data
    const wo = data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
    if (!wo) {
      rawHandleStatusClick(woId, status);
      return;
    }

    if (status === "Ready for Pickup") {
      setPendingPostService({
        woId,
        vehicleId: wo.vehicle?.id ?? "",
        vehiclePlate: formatPlateNumber(wo.vehicle?.plate_number ?? ""),
        currentOdometer: wo.vehicle?.odometer ?? null,
        newStatus: status,
        totalCost: Number(wo.total),
      });
      return;
    }

    if (status === "Completed") {
      setPendingPickupComplete({
        woId,
        vehicleId: wo.vehicle?.id ?? "",
        vehiclePlate: formatPlateNumber(wo.vehicle?.plate_number ?? ""),
        newStatus: status,
        totalCost: Number(wo.total),
      });
      return;
    }

    // Default: open status notes modal
    rawHandleStatusClick(woId, status);
  }

  async function handleStatusModalConfirm(
    woId: string,
    status: string,
    notes?: string,
  ) {
    handleStatusChangeConfirm(woId, status, notes);
  }

  // Handle PostServiceDialog confirm — save post-service data then update status
  async function handlePostServiceConfirm(data: PostServiceFormData) {
    if (!pendingPostService) return;
    const { woId, vehicleId } = pendingPostService;

    const { savePostServiceData } = await import(
      "@/lib/services/post-service-service"
    );
    await savePostServiceData({
      workOrderId: woId,
      vehicleId,
      odometerReading: data.odometerReading,
      recommendations: data.recommendations,
      mechanicNotes: data.mechanicNotes,
    });

    // Now change the status
    await handleStatusChangeConfirm(woId, pendingPostService.newStatus);
    setPendingPostService(null);
  }

  // Handle PickupCompleteDialog confirm — save completion data then update status
  async function handlePickupCompleteConfirm(data: PickupCompleteData) {
    if (!pendingPickupComplete) return;
    const { woId, vehicleId } = pendingPickupComplete;

    const { saveCompletionData } = await import(
      "@/lib/services/post-service-service"
    );
    await saveCompletionData({
      workOrderId: woId,
      vehicleId,
      customerSatisfaction: data.customerSatisfaction,
      customerFeedback: data.customerFeedback,
      nextAppointmentDate: data.nextAppointmentDate,
    });

    // Now change the status
    await handleStatusChangeConfirm(woId, pendingPickupComplete.newStatus);
    setPendingPickupComplete(null);
  }

  function handleOpenDetail(woId: string) {
    setDetailWoId(woId);
    setDetailDrawerOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("woId", woId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const handleQueueItemClick = useCallback(
    (wo: WorkOrder & { vehicle: Vehicle | null }) => {
      const id = wo.id;
      setDetailWoId(id);
      setDetailDrawerOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.set("woId", id);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [],
  );

  const handleQuickAssign = useCallback(
    async (workOrderId: string) => {
      markPending(workOrderId);
      try {
        const bay = data?.bays.find((b) => !b.workOrder);
        if (bay) {
          await assignVehicleToBay(workOrderId, bay.bayNumber);
          setToast({
            message: `${t("assignedToBay")} ${bay.bayNumber}`,
            variant: "info",
          });
          await fetchData(false);
        }
      } catch {
        setToast({ message: t("failedToAssign"), variant: "error" });
      } finally {
        clearPending(workOrderId);
      }
    },
    [data, t, markPending, clearPending, fetchData, setToast],
  );

  async function handleAssignToBay(workOrderId: string, mechanicId?: string) {
    if (assignBay === null) return;
    markPending(workOrderId);
    try {
      await assignVehicleToBay(workOrderId, assignBay);
      if (mechanicId) {
        const { assignMechanicToWorkOrder } = await import(
          "@/lib/services/bay-view-service"
        );
        await assignMechanicToWorkOrder(workOrderId, mechanicId);
      }
      setToast({
        message: `${t("assignedToBay")} ${assignBay}`,
        variant: "info",
      });
      await fetchData(false);
    } catch {
      setToast({ message: t("failedToAssign"), variant: "error" });
    } finally {
      clearPending(workOrderId);
    }
  }

  const userIsMechanic =
    currentProfile && data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = useMemo(
    () =>
      myJobsOnly
        ? (data?.bays.map((bay) => ({
            ...bay,
            workOrder:
              bay.workOrder?.mechanic?.id === currentProfile?.id
                ? bay.workOrder
                : null,
          })) ?? [])
        : (data?.bays ?? []),
    [data, myJobsOnly, currentProfile?.id],
  );

  const filteredQueue = useMemo(
    () =>
      myJobsOnly
        ? (data?.waitingQueue.filter(
            (wo) => wo.mechanic_id === currentProfile?.id,
          ) ?? [])
        : (data?.waitingQueue ?? []),
    [data, myJobsOnly, currentProfile?.id],
  );

  useEffect(() => {
    if (!data) return;
    registerTab(
      "queue",
      t("waitingQueue"),
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={handleQuickAssign}
        mechanics={data.mechanics}
        onItemClick={handleQueueItemClick}
      />,
      <List className="size-4" />,
    );
    registerTab(
      "mechanics",
      t("mechanics"),
      <MechanicPanel mechanics={data.mechanics} />,
      <Users className="size-4" />,
    );
    return () => {
      unregisterTab("queue");
      unregisterTab("mechanics");
    };
  }, [
    data,
    filteredQueue,
    pendingWoIds,
    handleQuickAssign,
    handleQueueItemClick,
    t,
    unregisterTab,
  ]);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <Typography.Muted className="text-sm text-muted-foreground">
          {error ?? t("noData")}
        </Typography.Muted>
        <Button variant="outline" size="sm" onClick={() => fetchData(true)}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const occupiedBays = data.bays.filter((b) => b.workOrder).length;
  const availableBays = data.bayCount - occupiedBays;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full flex-col bg-muted/20 overflow-hidden">
        <div className="flex-shrink-0 border-b border-border/50 bg-background/95 p-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">
              <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {data.bayCount}
                </span>{" "}
                {t("totalBays")}
              </span>
            </Badge>
            <Badge variant="outline">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {occupiedBays}
                </span>{" "}
                {t("occupied")}
              </span>
            </Badge>
            <Badge variant="outline">
              <span className="size-2 shrink-0 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {availableBays}
                </span>{" "}
                {t("available")}
              </span>
            </Badge>

            <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-card p-0.5">
              <Tooltip>
                <TooltipTrigger
                  className="size-6 shrink-0"
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setShowVehicleReg(true)}
                    />
                  }
                >
                  <Car className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("registerVehicle")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  className="size-6 shrink-0"
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setShowMechanicReg(true)}
                    />
                  }
                >
                  <Wrench className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("registerMechanic")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  className="size-6 shrink-0"
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setShowShiftReport(true)}
                    />
                  }
                >
                  <LayoutDashboard className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("shiftReport")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  className="size-6 shrink-0"
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setShowPinSettings(true)}
                    />
                  }
                >
                  <KeyRound className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("bayPinSettings")}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {userIsMechanic && (
                <Button
                  type="button"
                  size="sm"
                  variant={myJobsOnly ? "default" : "outline"}
                  onClick={() => setMyJobsOnly(!myJobsOnly)}
                >
                  {myJobsOnly ? t("myJobs") : t("allJobs")}
                </Button>
              )}

              <Button
                type="button"
                size="icon-xs"
                variant="outline"
                onClick={() => fetchData(true)}
                title={t("refresh")}
              >
                <RefreshCw className="size-3" />
              </Button>

              <ToggleGroup
                multiple={false}
                value={[viewMode]}
                onValueChange={(value) => {
                  if (value.length > 0) setViewMode(value[0] as ViewMode);
                }}
                variant="outline"
                className="[&>[data-slot=toggle-group-item]]:h-6 [&>[data-slot=toggle-group-item]]:w-6 [&>[data-slot=toggle-group-item]]:min-w-0 [&>[data-slot=toggle-group-item]]:px-0"
              >
                {VIEW_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Tooltip key={opt.mode}>
                      <TooltipTrigger
                        className="size-6 shrink-0"
                        render={
                          <ToggleGroupItem
                            value={opt.mode}
                            aria-label={t(opt.labelKey)}
                            className="h-6 w-6 min-w-0 px-0"
                          />
                        }
                      >
                        <Icon className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t(opt.labelKey)}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </ToggleGroup>

              <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-card p-0.5">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={async () => {
                    if (!data || bayCountMutationInFlightRef.current) return;
                    const next = Math.max(1, data.bayCount - 1);
                    if (next === data.bayCount) return;
                    setBayCountInputValue(next);
                    await applyBayCountChange(next);
                  }}
                  disabled={bayCountPending || data.bayCount <= 1}
                >
                  <Minus className="size-3" />
                </Button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={bayCountInputValue}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setBayCountInputValue(raw);
                    const next = parseInt(raw, 10);
                    if (isNaN(next) || next < 1 || next > 50) return;

                    if (bayCountDebounceRef.current)
                      clearTimeout(bayCountDebounceRef.current);
                    bayCountDebounceRef.current = setTimeout(() => {
                      applyBayCountChange(next);
                    }, 500);
                  }}
                  onBlur={() => {
                    if (bayCountDebounceRef.current) {
                      clearTimeout(bayCountDebounceRef.current);
                      bayCountDebounceRef.current = null;
                    }
                    const next = parseInt(String(bayCountInputValue), 10);
                    if (isNaN(next) || next < 1 || next > 50) {
                      setBayCountInputValue(data.bayCount);
                      return;
                    }
                    applyBayCountChange(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  disabled={bayCountPending}
                  className="size-6 border border-border/60 bg-background text-center text-xs font-semibold tabular-nums text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={async () => {
                    if (!data || bayCountMutationInFlightRef.current) return;
                    const next = Math.min(50, data.bayCount + 1);
                    if (next === data.bayCount) return;
                    setBayCountInputValue(next);
                    await applyBayCountChange(next);
                  }}
                  disabled={bayCountPending || data.bayCount >= 50}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 gap-1.5 p-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBays.map((bay) => (
                <BayCard
                  key={bay.bayNumber}
                  bay={bay}
                  isPending={
                    bay.workOrder ? !!pendingWoIds[bay.workOrder.id] : false
                  }
                  onStatusChange={handleStatusClick}
                  onRemoveFromBay={handleRemoveFromBay}
                  onOpenDetail={handleOpenDetail}
                  onAssignClick={(n) => setAssignBay(n)}
                />
              ))}
            </div>
          )}

          {viewMode === "kanban" && (
            <div className="flex h-full gap-2 overflow-x-auto p-2">
              {["New", "Diagnosing", "In Progress", "Ready for Pickup"].map(
                (status) => {
                  const baysWithStatus = filteredBays.filter(
                    (b) => b.workOrder?.status === status,
                  );
                  return (
                    <div
                      key={status}
                      className="flex min-w-[240px] max-w-[280px] flex-shrink-0 flex-col gap-3 bg-card/90 py-3 ring-1 ring-foreground/10"
                    >
                      <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-3 pb-3">
                        <div className="font-heading text-sm leading-snug font-medium">
                          {status}
                        </div>
                        <Badge
                          variant={
                            status === "In Progress" ? "default" : "secondary"
                          }
                        >
                          {baysWithStatus.length}
                        </Badge>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 px-3">
                        {baysWithStatus.map((bay) => (
                          <BayCard
                            key={bay.bayNumber}
                            bay={bay}
                            isPending={
                              bay.workOrder
                                ? !!pendingWoIds[bay.workOrder.id]
                                : false
                            }
                            onStatusChange={handleStatusClick}
                            onRemoveFromBay={handleRemoveFromBay}
                            onOpenDetail={handleOpenDetail}
                          />
                        ))}
                        {baysWithStatus.length === 0 && (
                          <div className="flex items-center justify-center border border-dashed border-muted-foreground/20 bg-muted/10 py-8 text-xs text-muted-foreground/50">
                            {t("emptyBay")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
              <div className="flex min-w-[240px] max-w-[280px] flex-shrink-0 flex-col gap-3 bg-card/90 py-3 ring-1 ring-foreground/10">
                <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-3 pb-3">
                  <div className="font-heading text-sm leading-snug font-medium">
                    {t("available")}
                  </div>
                  <Badge variant="outline">
                    {filteredBays.filter((b) => !b.workOrder).length}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-3">
                  {filteredBays
                    .filter((b) => !b.workOrder)
                    .map((bay) => (
                      <BayCard
                        key={bay.bayNumber}
                        bay={bay}
                        isPending={false}
                        onStatusChange={handleStatusClick}
                        onRemoveFromBay={handleRemoveFromBay}
                        onOpenDetail={handleOpenDetail}
                        onAssignClick={(n) => setAssignBay(n)}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === "list" && (
            <div className="p-2">
              <Card className="bg-card/90">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        {t("listHeaderBay")}
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        {t("listHeaderStatus")}
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        {t("listHeaderVehicle")}
                      </TableHead>
                      <TableHead className="hidden text-[10px] uppercase tracking-wider text-muted-foreground/60 sm:table-cell">
                        {t("listHeaderModel")}
                      </TableHead>
                      <TableHead className="hidden text-[10px] uppercase tracking-wider text-muted-foreground/60 md:table-cell">
                        {t("listHeaderMechanic")}
                      </TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground/60">
                        {t("listHeaderTime")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBays.map((bay) => {
                      const wo = bay.workOrder;
                      const v = wo?.vehicle;
                      return (
                        <TableRow
                          key={bay.bayNumber}
                          onClick={() =>
                            wo
                              ? handleOpenDetail(wo.id)
                              : setAssignBay(bay.bayNumber)
                          }
                          className={cn(
                            "border-b border-border/40 transition-colors cursor-pointer",
                            wo
                              ? "hover:bg-muted/20"
                              : "text-muted-foreground/50 hover:bg-accent/20",
                          )}
                        >
                          <TableCell className="font-medium">
                            #{bay.bayNumber}
                          </TableCell>
                          <TableCell>
                            {wo ? (
                              <Badge
                                variant={STATUS_VARIANT[wo.status] ?? "outline"}
                                className="text-[9px]"
                              >
                                {wo.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/50">
                                {t("emptyBay")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {wo && v ? (
                              formatPlateNumber(v.plate_number)
                            ) : wo ? (
                              "—"
                            ) : (
                              <span className="text-[10px] italic text-muted-foreground/40">
                                {t("clickToAssign")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {wo && v ? `${v.make} ${v.model}` : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {wo?.mechanic?.full_name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {wo ? (
                              <ElapsedText
                                startedAt={wo.started_at ?? wo.created_at}
                              />
                            ) : (
                              ""
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </div>

      {pendingStatusChange && (
        <StatusNotesModal
          woId={pendingStatusChange.woId}
          newStatus={pendingStatusChange.status}
          onConfirm={handleStatusModalConfirm}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}
      {pendingPostService && (
        <PostServiceDialog
          open={!!pendingPostService}
          onOpenChange={(open) => {
            if (!open) setPendingPostService(null);
          }}
          woId={pendingPostService.woId}
          vehicleId={pendingPostService.vehicleId}
          vehiclePlate={pendingPostService.vehiclePlate}
          currentOdometer={pendingPostService.currentOdometer}
          bayData={
            data.bays.find((b) => b.workOrder?.id === pendingPostService.woId)!
          }
          newStatus={pendingPostService.newStatus}
          onConfirm={handlePostServiceConfirm}
        />
      )}
      {pendingPickupComplete && (
        <PickupCompleteDialog
          open={!!pendingPickupComplete}
          onOpenChange={(open) => {
            if (!open) setPendingPickupComplete(null);
          }}
          woId={pendingPickupComplete.woId}
          vehiclePlate={pendingPickupComplete.vehiclePlate}
          totalCost={pendingPickupComplete.totalCost}
          onConfirm={handlePickupCompleteConfirm}
        />
      )}

      <AssignDialog
        key={assignBay ?? "closed"}
        open={assignBay !== null}
        onOpenChange={(open) => {
          if (!open) setAssignBay(null);
        }}
        bayNumber={assignBay ?? 0}
        queue={data.waitingQueue}
        mechanics={data.mechanics}
        onAssign={handleAssignToBay}
      />

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div className="flex items-center gap-2  border-2 border-primary/60 bg-card px-3 py-2 text-sm font-semibold shadow-xl">
            <GripVertical className="size-4 text-muted-foreground/40" />
            {activeDrag.label}
          </div>
        )}
      </DragOverlay>

      <ErrorBoundary>
        <WorkOrderDetailDrawer
          workOrderId={detailWoId}
          open={detailDrawerOpen}
          onOpenChange={(open) => {
            setDetailDrawerOpen(open);
            if (!open) {
              setDetailWoId(null);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("woId");
              router.replace(`?${params.toString()}`, { scroll: false });
            }
          }}
          onRefresh={() => fetchData(false)}
        />
      </ErrorBoundary>

      {/* Admin dialogs */}
      <ShiftReportDialog
        open={showShiftReport}
        onOpenChange={setShowShiftReport}
      />
      <PinSettingsDialog
        open={showPinSettings}
        onOpenChange={setShowPinSettings}
      />
      <VehicleRegistrationDialog
        open={showVehicleReg}
        onOpenChange={setShowVehicleReg}
        onQueued={() => {
          setShowVehicleReg(false);
          setToast({ message: "Added to waiting queue", variant: "info" });
          void fetchData(false);
        }}
      />
      <MechanicRegistrationDialog
        open={showMechanicReg}
        onOpenChange={setShowMechanicReg}
        onRegistered={async (email, fullName, phone) => {
          setShowMechanicReg(false);
          try {
            const { registerMechanic } = await import(
              "@/lib/services/bay-view-actions"
            );
            await registerMechanic({ email, fullName, phone });
            // Refetch to pick up the new mechanic with full shape
            void fetchData(false);
            setToast({
              message: t("mechanicRegistered", { name: fullName }),
              variant: "info",
            });
          } catch (err) {
            setToast({
              message:
                err instanceof Error
                  ? err.message
                  : "Failed to register mechanic",
              variant: "error",
            });
          }
        }}
      />

      {toast && (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </DndContext>
  );
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  New: "secondary",
  Diagnosing: "outline",
  "In Progress": "default",
  "Ready for Pickup": "secondary",
  Completed: "outline",
  Cancelled: "destructive",
};

function ElapsedText({ startedAt }: { startedAt: string | null | undefined }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!startedAt) {
      setDisplay("");
      return;
    }
    const ms = new Date(startedAt).getTime();
    const tick = () => {
      const d = Math.floor((Date.now() - ms) / 60000);
      setDisplay(d < 60 ? `${d}m` : `${Math.floor(d / 60)}h ${d % 60}m`);
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <>{display}</>;
}
