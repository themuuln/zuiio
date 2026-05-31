"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Car,
  CheckCircle2,
  Columns3,
  GripVertical,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  List,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { usePolling } from "@/hooks/use-polling";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type {
  BaySlotData,
  BayViewData,
  ShiftReport,
} from "@/lib/services/bay-view-service";
import {
  assignVehicleToBay,
  getBayViewDataFresh,
  getShiftReport,
} from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { cn, formatMNT, formatPlateNumber } from "@/lib/utils";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { AssignDialog } from "./assign-dialog";
import { BayCard, BayCardDragPreview, STATUS_BADGE_CLASS } from "./bay-card";
import { MechanicPanel } from "./mechanic-panel";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import type { PickupCompleteData } from "./pickup-complete-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import { PinSettingsDialog } from "./pin-settings-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import { QueuePanel } from "./queue-panel";
import { ShiftReportDialog } from "./shift-report-dialog";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

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

interface ActiveDragState {
  type: string;
  label: string;
  previewBay?: BaySlotData | null;
}

function KanbanDropColumn({
  status,
  children,
  className,
}: {
  status: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `kanban-status-${encodeURIComponent(status)}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-200 rounded-xl",
        isOver && "bg-primary/5 ring-1 ring-primary/20",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BayViewV2Client() {
  const t = useTranslations("bayView");
  const [data, setData] = useState<BayViewData | null>(null);
  const [shiftReport, setShiftReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
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
  const [baySearchQuery, setBaySearchQuery] = useState("");
  const prevShiftReportRef = useRef<ShiftReport | null>(null);
  const polling = usePolling(() => fetchData(false), 30000);

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
      const [result, report] = await Promise.all([
        getBayViewDataFresh(),
        getShiftReport().catch(() => null),
      ]);
      setData(result);
      if (report) setShiftReport(report);
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

    return () => {
      abort.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (data) bayCountValueRef.current = data.bayCount;
  }, [data]);

  useEffect(() => {
    if (data) setBayCountInputValue(data.bayCount);
  }, [data]);

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
    onStatusChange: handleStatusClick,
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
      const previewBay = data?.bays.find((b) => b.workOrder?.id === id) ?? null;
      const plate = wo?.vehicle?.plate_number;
      if (plate) {
        setActiveDrag({
          type: "vehicle",
          label: formatPlateNumber(plate),
          previewBay,
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

  function onDragCancel() {
    setActiveDrag(null);
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

  // Intercept status clicks — open PickupCompleteDialog for "Completed"
  function handleStatusClick(woId: string, status: string) {
    // Find the work order in current data
    const wo = data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
    if (!wo) {
      rawHandleStatusClick(woId, status);
      return;
    }

    // Completed — show pickup completion dialog for customer feedback
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

    // All other statuses (including "Ready for Pickup"): open status notes modal
    // Post-service data can be filled later from the detail drawer
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

  const availableBays = useMemo(
    () => data?.bays.filter((b) => !b.workOrder).map((b) => b.bayNumber) ?? [],
    [data],
  );

  const handleQuickAssignToBay = useCallback(
    async (workOrderId: string, bayNumber: number) => {
      markPending(workOrderId);
      try {
        await assignVehicleToBay(workOrderId, bayNumber);
        setToast({
          message: `${t("assignedToBay")} ${bayNumber}`,
          variant: "info",
        });
        await fetchData(false);
      } catch {
        setToast({ message: t("failedToAssign"), variant: "error" });
      } finally {
        clearPending(workOrderId);
      }
    },
    [t, markPending, clearPending, fetchData],
  );

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
    [data, t, markPending, clearPending, fetchData],
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

  const filteredQueue = useMemo(() => data?.waitingQueue ?? [], [data]);

  // Track previous shift report for trend comparison
  useEffect(() => {
    if (shiftReport) {
      prevShiftReportRef.current = shiftReport;
    }
  }, [shiftReport]);

  // Pause auto-refresh when any dialog/drawer is open
  useEffect(() => {
    const anyDialogOpen =
      showShiftReport ||
      showPinSettings ||
      showVehicleReg ||
      showMechanicReg ||
      !!pendingPostService ||
      !!pendingPickupComplete ||
      !!pendingStatusChange ||
      assignBay !== null ||
      detailDrawerOpen;
    if (anyDialogOpen) {
      polling.pause();
    } else {
      polling.resume();
    }
  }, [
    showShiftReport,
    showPinSettings,
    showVehicleReg,
    showMechanicReg,
    pendingPostService,
    pendingPickupComplete,
    pendingStatusChange,
    assignBay,
    detailDrawerOpen,
  ]);

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
        availableBays={availableBays}
        onAssignToBay={handleQuickAssignToBay}
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
    registerTab,
    t,
    unregisterTab,
  ]);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 min-h-[400px]">
        <Typography.Muted className="text-base text-muted-foreground">
          {error
            ? "Couldn't load bay view. Check your internet connection."
            : t("noData")}
        </Typography.Muted>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          className="rounded-lg shadow-sm font-semibold"
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  const occupiedBays = data.bays.filter((b) => b.workOrder).length;
  const pendingPostServiceBay = pendingPostService
    ? (data.bays.find((b) => b.workOrder?.id === pendingPostService.woId) ??
      null)
    : null;

  // Trend delta computation for KPI cards (compare current vs previous poll)
  const prevShiftReport = prevShiftReportRef.current;
  const trendDelta =
    shiftReport && prevShiftReport
      ? {
          bayUtilization:
            shiftReport.bayUtilization - prevShiftReport.bayUtilization,
          activeJobs: shiftReport.activeJobs - prevShiftReport.activeJobs,
          completedToday:
            shiftReport.completedToday - prevShiftReport.completedToday,
          revenueToday: shiftReport.revenueToday - prevShiftReport.revenueToday,
        }
      : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-full flex-col bg-muted/20 overflow-hidden rounded-2xl border border-border/40 shadow-sm">
        {/* Sleek Controls Toolbar */}
        <div className="flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md p-3 select-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left Controls (View Selector, Filter, Refresh) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Segmented view selector */}
              <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-0.5 shadow-sm h-8">
                {VIEW_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = viewMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setViewMode(opt.mode)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-all cursor-pointer h-full",
                        isActive
                          ? "bg-background text-foreground shadow-sm font-bold border border-border/30"
                          : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground",
                      )}
                      title={t(opt.labelKey)}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden md:inline text-[11px]">
                        {t(opt.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* My Jobs Filter Toggle */}
              {userIsMechanic && (
                <Button
                  type="button"
                  size="sm"
                  variant={myJobsOnly ? "default" : "outline"}
                  onClick={() => setMyJobsOnly(!myJobsOnly)}
                  className={cn(
                    "h-8 rounded-lg text-xs font-semibold cursor-pointer border-border/50 shadow-sm",
                    myJobsOnly
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "hover:bg-accent hover:text-foreground text-muted-foreground",
                  )}
                >
                  {myJobsOnly ? t("myJobs") : t("allJobs")}
                </Button>
              )}

              {/* Refresh Button */}
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => fetchData(true)}
                title={t("refresh")}
                className="rounded-lg border-border/50 text-muted-foreground shadow-sm hover:text-foreground cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
              </Button>

              {/* Search Bar */}
              <div className="relative min-w-[180px] max-w-[220px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  type="text"
                  value={baySearchQuery}
                  onChange={(e) => setBaySearchQuery(e.target.value)}
                  placeholder="Search plate, make, model..."
                  className="h-8 pl-7 pr-7 text-xs"
                />
                {baySearchQuery && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setBaySearchQuery("")}
                    className="absolute right-0.5 top-1/2 size-6 -translate-y-1/2 p-0 text-muted-foreground/50"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right Controls (Action Buttons & Bay Count) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick Admin Actions Box */}
              <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card px-1 shadow-sm h-8">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowVehicleReg(true)}
                        className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                      />
                    }
                  >
                    <Car className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[11px] font-semibold"
                  >
                    {t("registerVehicle")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowMechanicReg(true)}
                        className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                      />
                    }
                  >
                    <Wrench className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[11px] font-semibold"
                  >
                    {t("registerMechanic")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowShiftReport(true)}
                        className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                      />
                    }
                  >
                    <LayoutDashboard className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[11px] font-semibold"
                  >
                    {t("shiftReport")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setShowPinSettings(true)}
                        className="rounded-md hover:bg-muted hover:text-primary transition-colors text-muted-foreground/85 cursor-pointer"
                      />
                    }
                  >
                    <KeyRound className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[11px] font-semibold"
                  >
                    {t("bayPinSettings")}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Digital Bay Counter */}
              <div className="flex items-center gap-1.5 border border-border/50 bg-card rounded-lg p-0.5 pr-2.5 pl-1.5 shadow-sm h-8">
                <span className="text-[10px] font-mono font-black text-muted-foreground/75 uppercase tracking-wider px-1 select-none">
                  Bays
                </span>
                <div className="flex items-center gap-0.5 rounded border border-border/40 bg-muted/20 p-0.5 h-full">
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
                    className="size-5 rounded hover:bg-background cursor-pointer text-muted-foreground"
                  >
                    <Minus className="size-2.5" />
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
                      if (Number.isNaN(next) || next < 1 || next > 50) return;

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
                      if (Number.isNaN(next) || next < 1 || next > 50) {
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
                    className="h-5 w-7 bg-transparent border-0 text-center text-xs font-bold font-mono text-foreground focus:outline-none focus:ring-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                    className="size-5 rounded hover:bg-background cursor-pointer text-muted-foreground"
                  >
                    <Plus className="size-2.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Statistics Grid Header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 pt-3 flex-shrink-0 bg-muted/10 border-b border-border/40">
          {/* Card 1: Bay Utilization */}
          <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3.5 flex flex-col gap-2 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {t("bayUtilization")}
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold font-mono tracking-tight">
                {shiftReport?.bayUtilization ?? 0}%
                {trendDelta && trendDelta.bayUtilization !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-semibold ml-1.5",
                      trendDelta.bayUtilization > 0
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    {trendDelta.bayUtilization > 0 ? (
                      <ArrowUp className="size-2.5" />
                    ) : (
                      <ArrowDown className="size-2.5" />
                    )}
                    {Math.abs(trendDelta.bayUtilization)}%
                  </span>
                )}
              </span>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${shiftReport?.bayUtilization ?? 0}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {occupiedBays} of {data.bayCount} bays occupied
            </span>
          </Card>

          {/* Card 2: Active Workloads */}
          <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3.5 flex flex-col justify-between rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {t("activeJobs")}
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <Wrench className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono tracking-tight">
                {shiftReport?.activeJobs ?? 0}
                {trendDelta && trendDelta.activeJobs !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-semibold ml-1.5",
                      trendDelta.activeJobs > 0
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    {trendDelta.activeJobs > 0 ? (
                      <ArrowUp className="size-2.5" />
                    ) : (
                      <ArrowDown className="size-2.5" />
                    )}
                    {Math.abs(trendDelta.activeJobs)}
                  </span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                active
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
              +{data.waitingQueue.length} in waiting queue
            </span>
          </Card>

          {/* Card 3: Completed Today */}
          <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3.5 flex flex-col justify-between rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {t("completedToday")}
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono tracking-tight">
                {shiftReport?.completedToday ?? 0}
                {trendDelta && trendDelta.completedToday !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-semibold ml-1.5",
                      trendDelta.completedToday > 0
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    {trendDelta.completedToday > 0 ? (
                      <ArrowUp className="size-2.5" />
                    ) : (
                      <ArrowDown className="size-2.5" />
                    )}
                    {Math.abs(trendDelta.completedToday)}
                  </span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                completed
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
              Avg duration: {shiftReport?.avgDurationMinutes ?? 0}m
            </span>
          </Card>

          {/* Card 4: Revenue Today */}
          <Card className="bg-card/65 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 p-3.5 flex flex-col justify-between rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {t("revenueToday")}
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
                <Wallet className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatMNT(shiftReport?.revenueToday ?? 0)}
                {trendDelta && trendDelta.revenueToday !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-semibold ml-1.5",
                      trendDelta.revenueToday > 0
                        ? "text-emerald-500"
                        : "text-red-500",
                    )}
                  >
                    {trendDelta.revenueToday > 0 ? (
                      <ArrowUp className="size-2.5" />
                    ) : (
                      <ArrowDown className="size-2.5" />
                    )}
                    {formatMNT(Math.abs(trendDelta.revenueToday))}
                  </span>
                )}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium mt-1">
              Today's invoices paid
            </span>
          </Card>
        </div>

        {/* Scrollable View Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/5">
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 overflow-y-auto w-full h-full">
              {searchedBays.map((bay) => (
                <BayCard
                  key={bay.bayNumber}
                  bay={bay}
                  isPending={
                    bay.workOrder ? !!pendingWoIds[bay.workOrder.id] : false
                  }
                  isKanbanMode={false}
                  onStatusChange={handleStatusClick}
                  onRemoveFromBay={handleRemoveFromBay}
                  onOpenDetail={handleOpenDetail}
                  onAssignClick={(n) => setAssignBay(n)}
                />
              ))}
            </div>
          )}

          {viewMode === "kanban" && (
            <div className="flex h-full gap-4 overflow-x-auto overflow-y-hidden p-4 w-full">
              {/* Kanban Column: Vacant Bays */}
              <div className="flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col gap-3.5 bg-card/85 backdrop-blur-sm rounded-xl py-3 border border-border/50 border-t-4 border-t-slate-300 dark:border-t-slate-800 shadow-sm">
                <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-4 pb-2.5 select-none">
                  <div className="font-heading text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    {t("available")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        const emptyBay = data?.bays.find((b) => !b.workOrder);
                        if (emptyBay) {
                          setAssignBay(emptyBay.bayNumber);
                        } else {
                          setToast({
                            message: "No empty bays available",
                            variant: "error",
                          });
                        }
                      }}
                      className="size-5 rounded hover:bg-muted text-muted-foreground/80 hover:text-foreground cursor-pointer"
                      title="Assign vehicle to an empty bay"
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Badge
                      variant="outline"
                      className="font-mono font-bold text-[10px] rounded-full h-5"
                    >
                      {searchedBays.filter((b) => !b.workOrder).length}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 px-3 overflow-y-auto no-scrollbar">
                  {searchedBays
                    .filter((b) => !b.workOrder)
                    .map((bay) => (
                      <div
                        key={bay.bayNumber}
                        className="flex flex-col shrink-0"
                      >
                        <BayCard
                          bay={bay}
                          isPending={false}
                          isKanbanMode
                          onStatusChange={handleStatusClick}
                          onRemoveFromBay={handleRemoveFromBay}
                          onOpenDetail={handleOpenDetail}
                          onAssignClick={(n) => setAssignBay(n)}
                        />
                      </div>
                    ))}
                  {searchedBays.filter((b) => !b.workOrder).length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setToast({
                          message: "No empty bays available",
                          variant: "error",
                        });
                      }}
                      className="flex flex-col items-center justify-center border border-dashed border-border/40 bg-muted/10 py-12 rounded-xl text-center select-none p-4 w-full cursor-not-allowed opacity-60 group/empty"
                    >
                      <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/45 bg-background mb-2 shadow-sm">
                        <Plus className="size-3.5 text-muted-foreground/60" />
                      </div>
                      <Typography.Muted className="text-[10px] text-muted-foreground/45 font-semibold">
                        No Vacant Bays
                      </Typography.Muted>
                    </button>
                  )}
                </div>
              </div>

              {["New", "Diagnosing", "In Progress", "Ready for Pickup"].map(
                (status) => {
                  const baysWithStatus = searchedBays.filter(
                    (b) => b.workOrder?.status === status,
                  );

                  const columnColors: Record<string, string> = {
                    New: "border-t-amber-400 bg-amber-400/5",
                    Diagnosing: "border-t-blue-400 bg-blue-400/5",
                    "In Progress": "border-t-indigo-500 bg-indigo-500/5",
                    "Ready for Pickup": "border-t-emerald-500 bg-emerald-500/5",
                  };

                  return (
                    <KanbanDropColumn
                      key={status}
                      status={status}
                      className={cn(
                        "flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col gap-3.5 bg-card/85 backdrop-blur-sm rounded-xl py-3 border border-border/50 border-t-4 shadow-sm",
                        columnColors[status] ?? "border-t-primary",
                      )}
                    >
                      <div className="flex flex-row items-center justify-between gap-2 border-b border-border/40 px-4 pb-2.5 select-none">
                        <div className="font-heading text-xs uppercase tracking-wider font-bold text-foreground/80">
                          {status}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => {
                              const emptyBay = data?.bays.find(
                                (b) => !b.workOrder,
                              );
                              if (emptyBay) {
                                setAssignBay(emptyBay.bayNumber);
                              } else {
                                setToast({
                                  message: "No empty bays available",
                                  variant: "error",
                                });
                              }
                            }}
                            className="size-5 rounded hover:bg-muted text-muted-foreground/80 hover:text-foreground cursor-pointer"
                            title="Assign vehicle to an empty bay"
                          >
                            <Plus className="size-3" />
                          </Button>
                          <Badge
                            variant={
                              status === "In Progress" ? "default" : "secondary"
                            }
                            className="font-mono font-bold text-[10px] rounded-full h-5"
                          >
                            {baysWithStatus.length}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 px-3 overflow-y-auto no-scrollbar">
                        {baysWithStatus.map((bay) => (
                          <div
                            key={bay.bayNumber}
                            className="flex flex-col shrink-0"
                          >
                            <BayCard
                              bay={bay}
                              isPending={
                                bay.workOrder
                                  ? !!pendingWoIds[bay.workOrder.id]
                                  : false
                              }
                              isKanbanMode
                              onStatusChange={handleStatusClick}
                              onRemoveFromBay={handleRemoveFromBay}
                              onOpenDetail={handleOpenDetail}
                            />
                          </div>
                        ))}
                        {baysWithStatus.length === 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const emptyBay = data?.bays.find(
                                (b) => !b.workOrder,
                              );
                              if (emptyBay) {
                                setAssignBay(emptyBay.bayNumber);
                              } else {
                                setToast({
                                  message: "No empty bays available",
                                  variant: "error",
                                });
                              }
                            }}
                            className="flex flex-col items-center justify-center border border-dashed border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-primary/5 py-12 rounded-xl text-center select-none p-4 cursor-pointer group/empty w-full"
                          >
                            <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/45 bg-background group-hover/empty:scale-110 group-hover/empty:border-primary/50 group-hover/empty:text-primary transition-all mb-2 shadow-sm">
                              <Plus className="size-3.5 text-muted-foreground/60 group-hover/empty:text-primary" />
                            </div>
                            <Typography.Muted className="text-[10px] text-muted-foreground/45 font-semibold group-hover/empty:text-primary transition-colors">
                              Assign Vehicle
                            </Typography.Muted>
                          </button>
                        )}
                      </div>
                    </KanbanDropColumn>
                  );
                },
              )}
            </div>
          )}

          {viewMode === "list" && (
            <div className="p-4 overflow-y-auto w-full h-full">
              <Card className="bg-card/75 backdrop-blur border-border/50 shadow-sm rounded-xl overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/40 select-none">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 pl-4 py-3">
                        {t("listHeaderBay")}
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 py-3">
                        {t("listHeaderStatus")}
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 py-3">
                        {t("listHeaderVehicle")}
                      </TableHead>
                      <TableHead className="hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 sm:table-cell py-3">
                        {t("listHeaderModel")}
                      </TableHead>
                      <TableHead className="hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 md:table-cell py-3">
                        {t("listHeaderMechanic")}
                      </TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 pr-4 py-3">
                        {t("listHeaderTime")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchedBays.map((bay) => {
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
                            "border-b border-border/30 transition-colors cursor-pointer",
                            wo
                              ? "hover:bg-muted/30"
                              : "text-muted-foreground/50 hover:bg-accent/30",
                          )}
                        >
                          <TableCell className="font-semibold pl-4 py-3 font-mono">
                            #{String(bay.bayNumber).padStart(2, "0")}
                          </TableCell>
                          <TableCell className="py-3">
                            {wo ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full",
                                  STATUS_BADGE_CLASS[wo.status],
                                )}
                              >
                                {wo.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-medium">
                                {t("emptyBay")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            {wo && v ? (
                              <span className="font-mono text-xs font-bold">
                                {formatPlateNumber(v.plate_number)}
                              </span>
                            ) : wo ? (
                              "—"
                            ) : (
                              <span className="text-[10px] italic text-muted-foreground/40 font-medium">
                                {t("clickToAssign")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-foreground font-bold sm:table-cell py-3">
                            {wo && v ? `${v.make} ${v.model}` : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-3">
                            {wo?.mechanic ? (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="bg-background font-medium py-0.5 px-2 text-[10px] rounded-full border-border/40"
                                >
                                  {wo.mechanic.full_name}
                                </Badge>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium tabular-nums pr-4 py-3 text-muted-foreground">
                            {wo ? (
                              <ElapsedText
                                startedAt={wo.started_at ?? wo.created_at}
                              />
                            ) : (
                              "—"
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
      {pendingPostService && pendingPostServiceBay && (
        <PostServiceDialog
          open={!!pendingPostService}
          onOpenChange={(open) => {
            if (!open) setPendingPostService(null);
          }}
          woId={pendingPostService.woId}
          vehicleId={pendingPostService.vehicleId}
          vehiclePlate={pendingPostService.vehiclePlate}
          currentOdometer={pendingPostService.currentOdometer}
          bayData={pendingPostServiceBay}
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
        {activeDrag &&
          (activeDrag.type === "vehicle" && activeDrag.previewBay ? (
            <div className="origin-top-left rotate-[1deg] scale-[1.02]">
              <BayCardDragPreview bay={activeDrag.previewBay} />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border-2 border-primary/60 bg-card px-3 py-2 text-sm font-semibold shadow-xl">
              <GripVertical className="size-4 text-muted-foreground/40" />
              {activeDrag.label}
            </div>
          ))}
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
