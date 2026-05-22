"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  GripVertical,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  List,
  Minus,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Car,
  Wrench,
  Columns3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  assignVehicleToBay,
  getBayViewDataFresh,
} from "@/lib/services/bay-view-service";
import { useBayDragHandlers } from "@/components/bay-view/_bay-drag-handlers";
import { useBayActionHandlers } from "@/components/bay-view/_bay-action-handlers";
import { StatusNotesModal } from "@/components/bay-view/status-notes-modal";
import { ToastMessage } from "@/components/bay-view/toast-message";
import { WorkOrderDetailDrawer } from "@/components/bay-view/work-order-detail-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { cn, formatPlateNumber } from "@/lib/utils";
import { BayCard } from "./bay-card";
import { QueuePanel } from "./queue-panel";
import { MechanicPanel } from "./mechanic-panel";
import { AssignDialog } from "./assign-dialog";
import { ShiftReportDialog } from "./shift-report-dialog";
import { PinSettingsDialog } from "./pin-settings-dialog";
import { VehicleRegistrationDialog } from "./vehicle-registration-dialog";
import { MechanicRegistrationDialog } from "./mechanic-registration-dialog";
import { PostServiceDialog } from "./post-service-dialog";
import type { PostServiceFormData } from "./post-service-dialog";
import { PickupCompleteDialog } from "./pickup-complete-dialog";
import type { PickupCompleteData } from "./pickup-complete-dialog";

type ViewMode = "grid" | "kanban" | "list";

const VIEW_OPTIONS: { mode: ViewMode; icon: typeof LayoutGrid; labelKey: string }[] = [
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
  const [detailWoId, setDetailWoId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
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

  const { registerTab, setOpen } = useRightSidebar();
  const [toast, setToast] = useState<ToastState | null>(null);

  function markPending(...ids: string[]) {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) next[id] = true;
      return next;
    });
  }

  function clearPending(...ids: string[]) {
    setPendingWoIds((prev) => {
      const next = { ...prev };
      for (const id of ids) if (id) delete next[id];
      return next;
    });
  }

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

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
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
    const id = event.active.data.current?.workOrderId as string | undefined;
    if (id) {
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

  // Intercept status clicks — open PostServiceDialog for "Ready for Pickup"
  // and PickupCompleteDialog for "Completed"
  function handleStatusClick(woId: string, status: string) {
    // Find the work order in current data
    const wo =
      data?.bays.find((b) => b.workOrder?.id === woId)?.workOrder;
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

  async function handleStatusModalConfirm(woId: string, status: string, notes?: string) {
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
  }

  function handleQueueItemClick(wo: WorkOrder & { vehicle: Vehicle | null }) {
    setDetailWoId(wo.id);
    setDetailDrawerOpen(true);
  }

  async function handleQuickAssign(workOrderId: string) {
    markPending(workOrderId);
    try {
      const bay = data?.bays.find((b) => !b.workOrder);
      if (bay) {
        await assignVehicleToBay(workOrderId, bay.bayNumber);
        setToast({ message: `${t("assignedToBay")} ${bay.bayNumber}`, variant: "info" });
        await fetchData(false);
      }
    } catch {
      setToast({ message: t("failedToAssign"), variant: "error" });
    } finally {
      clearPending(workOrderId);
    }
  }

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
      setToast({ message: `${t("assignedToBay")} ${assignBay}`, variant: "info" });
      await fetchData(false);
    } catch {
      setToast({ message: t("failedToAssign"), variant: "error" });
    } finally {
      clearPending(workOrderId);
    }
  }

  const userIsMechanic =
    currentProfile && data?.mechanics.some((m) => m.id === currentProfile.id);

  const filteredBays = myJobsOnly
    ? (data?.bays.map((bay) => ({
        ...bay,
        workOrder:
          bay.workOrder?.mechanic?.id === currentProfile?.id
            ? bay.workOrder
            : null,
      })) ?? [])
    : (data?.bays ?? []);

  const filteredQueue = myJobsOnly
    ? (data?.waitingQueue.filter(
        (wo) => wo.mechanic_id === currentProfile?.id,
      ) ?? [])
    : (data?.waitingQueue ?? []);

  useEffect(() => {
    if (!data) return;
    registerTab("queue", t("waitingQueue"), (
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={handleQuickAssign}
        mechanics={data.mechanics}
        onItemClick={handleQueueItemClick}
      />
    ));
    registerTab("mechanics", t("mechanics"), (
      <MechanicPanel mechanics={data.mechanics} />
    ));
    setOpen(true);
  }, [data, filteredQueue, pendingWoIds, handleQuickAssign, handleQueueItemClick, t]);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-sm text-muted-foreground">{error ?? t("noData")}</p>
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
      <div className="flex h-full flex-col">
        {/* Header: Title + Subtitle */}
        <div className="border-b border-border/50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {t("allJobsSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {userIsMechanic && (
                <button
                  type="button"
                  onClick={() => setMyJobsOnly(!myJobsOnly)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                    myJobsOnly
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {myJobsOnly ? t("myJobs") : t("allJobs")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center justify-center size-8 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
                title={t("showSidebar")}
              >
                <PanelRightOpen className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => fetchData(true)}
                className="flex items-center justify-center size-8 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
                title={t("refresh")}
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>

          {/* Stats bar + toolbar */}
          <div className="flex items-center gap-2 mt-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-2.5 py-1">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              <span className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{data.bayCount}</span> {t("totalBays")}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-2.5 py-1">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{occupiedBays}</span> {t("occupied")}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-2.5 py-1">
              <span className="size-2 rounded-full bg-blue-500" />
              <span className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{availableBays}</span> {t("available")}
              </span>
            </div>

            {/* Toolbar actions */}
            <div className="ml-2 flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setShowVehicleReg(true)}
                      className="flex items-center justify-center size-6 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                    />
                  }
                >
                  <Car className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("registerVehicle")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setShowMechanicReg(true)}
                      className="flex items-center justify-center size-6 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                    />
                  }
                >
                  <Wrench className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("registerMechanic")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setShowShiftReport(true)}
                      className="flex items-center justify-center size-6 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                    />
                  }
                >
                  <LayoutDashboard className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("shiftReport")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setShowPinSettings(true)}
                      className="flex items-center justify-center size-6 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                    />
                  }
                >
                  <KeyRound className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("bayPinSettings")}</TooltipContent>
              </Tooltip>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {/* View mode toggle */}
              <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-card p-0.5">
                {VIEW_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Tooltip key={opt.mode}>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => setViewMode(opt.mode)}
                            className={cn(
                              "flex items-center justify-center size-7 rounded transition-colors",
                              viewMode === opt.mode
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted",
                            )}
                          />
                        }
                      >
                        <Icon className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{t(opt.labelKey)}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Bay count adjuster */}
              <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-card px-1.5 py-0.5 ml-1">
                <button
                  type="button"
                  onClick={async () => { await handleBayCountChange(data.bayCount - 1); await fetchData(false); }}
                  disabled={data.bayCount <= 1}
                  className="flex items-center justify-center size-5 rounded text-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-30"
                >
                  <Minus className="size-3" />
                </button>
                <span className="min-w-[16px] text-center text-[10px] font-semibold tabular-nums text-foreground">
                  {data.bayCount}
                </span>
                <button
                  type="button"
                  onClick={async () => { await handleBayCountChange(data.bayCount + 1); await fetchData(false); }}
                  disabled={data.bayCount >= 50}
                  className="flex items-center justify-center size-5 rounded text-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-30"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1 p-1.5">
                {filteredBays.map((bay) => (
                  <BayCard
                    key={bay.bayNumber}
                    bay={bay}
                    onStatusChange={handleStatusClick}
                    onRemoveFromBay={handleRemoveFromBay}
                    onOpenDetail={handleOpenDetail}
                    onAssignClick={(n) => setAssignBay(n)}
                  />
                ))}
              </div>
            )}

            {viewMode === "kanban" && (
              <div className="flex gap-2 p-2 h-full overflow-x-auto">
                {["New", "Diagnosing", "In Progress", "Ready for Pickup"].map((status) => {
                  const baysWithStatus = filteredBays.filter((b) => b.workOrder?.status === status);
                  return (
                    <div key={status} className="flex flex-col gap-1.5 min-w-[200px] max-w-[240px] flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={status === "In Progress" ? "default" : "secondary"} className="text-[10px] px-1.5">{baysWithStatus.length}</Badge>
                        <span className="text-xs font-medium">{status}</span>
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        {baysWithStatus.map((bay) => (
                          <BayCard key={bay.bayNumber} bay={bay} onStatusChange={handleStatusClick} onRemoveFromBay={handleRemoveFromBay} onOpenDetail={handleOpenDetail} />
                        ))}
                        {baysWithStatus.length === 0 && (
                          <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 py-6 text-xs text-muted-foreground/40">{t("emptyBay")}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex flex-col gap-2 min-w-[220px] max-w-[260px] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5">{filteredBays.filter((b) => !b.workOrder).length}</Badge>
                    <span className="text-xs font-medium">{t("available")}</span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {filteredBays.filter((b) => !b.workOrder).map((bay) => (
                      <BayCard key={bay.bayNumber} bay={bay} onStatusChange={handleStatusClick} onRemoveFromBay={handleRemoveFromBay} onOpenDetail={handleOpenDetail} onAssignClick={(n) => setAssignBay(n)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewMode === "list" && (
              <div className="p-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground/60 text-[10px] uppercase tracking-wider">
                      <th className="text-left font-medium py-1.5 px-2">{t("listHeaderBay")}</th>
                      <th className="text-left font-medium py-1.5 px-2">{t("listHeaderStatus")}</th>
                      <th className="text-left font-medium py-1.5 px-2">{t("listHeaderVehicle")}</th>
                      <th className="text-left font-medium py-1.5 px-2 hidden sm:table-cell">{t("listHeaderModel")}</th>
                      <th className="text-left font-medium py-1.5 px-2 hidden md:table-cell">{t("listHeaderMechanic")}</th>
                      <th className="text-right font-medium py-1.5 px-2">{t("listHeaderTime")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBays.map((bay) => {
                      const wo = bay.workOrder;
                      const v = wo?.vehicle;
                      return (
                        <tr
                          key={bay.bayNumber}
                          onClick={() => wo ? handleOpenDetail(wo.id) : setAssignBay(bay.bayNumber)}
                          className={cn(
                            "border-b border-border/40 transition-colors cursor-pointer",
                            wo ? "hover:bg-muted/20" : "text-muted-foreground/50 hover:bg-accent/20",
                          )}
                        >
                          <td className="py-2 px-2 font-medium">#{bay.bayNumber}</td>
                          <td className="py-2 px-2">
                            {wo ? <Badge variant={STATUS_VARIANT[wo.status] ?? "outline"} className="text-[9px] h-4 px-1.5">{wo.status}</Badge> : <span className="text-muted-foreground/50">{t("emptyBay")}</span>}
                          </td>
                          <td className="py-2 px-2 font-medium">{wo && v ? formatPlateNumber(v.plate_number) : wo ? "—" : <span className="text-muted-foreground/40 italic text-[10px]">{t("clickToAssign")}</span>}</td>
                          <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{wo && v ? `${v.make} ${v.model}` : "—"}</td>
                          <td className="py-2 px-2 hidden md:table-cell">{wo?.mechanic?.full_name ?? "—"}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{wo ? <ElapsedText startedAt={wo.started_at ?? wo.created_at} /> : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {pendingStatusChange && (
        <StatusNotesModal woId={pendingStatusChange.woId} newStatus={pendingStatusChange.status} onConfirm={handleStatusModalConfirm} onCancel={() => setPendingStatusChange(null)} />
      )}

      {/* Post-service dialog (Ready for Pickup) */}
      {pendingPostService && (
        <PostServiceDialog
          open={!!pendingPostService}
          onOpenChange={(open) => { if (!open) setPendingPostService(null); }}
          woId={pendingPostService.woId}
          vehicleId={pendingPostService.vehicleId}
          vehiclePlate={pendingPostService.vehiclePlate}
          currentOdometer={pendingPostService.currentOdometer}
          bayData={data.bays.find((b) => b.workOrder?.id === pendingPostService.woId)!}
          newStatus={pendingPostService.newStatus}
          onConfirm={handlePostServiceConfirm}
        />
      )}

      {/* Pickup complete dialog (Completed) */}
      {pendingPickupComplete && (
        <PickupCompleteDialog
          open={!!pendingPickupComplete}
          onOpenChange={(open) => { if (!open) setPendingPickupComplete(null); }}
          woId={pendingPickupComplete.woId}
          vehiclePlate={pendingPickupComplete.vehiclePlate}
          totalCost={pendingPickupComplete.totalCost}
          onConfirm={handlePickupCompleteConfirm}
        />
      )}

      <AssignDialog key={assignBay ?? 'closed'} open={assignBay !== null} onOpenChange={(open) => { if (!open) setAssignBay(null); }} bayNumber={assignBay ?? 0} queue={data.waitingQueue} mechanics={data.mechanics} onAssign={handleAssignToBay} />

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-primary/60 bg-card px-3 py-2 text-sm font-semibold shadow-xl">
            <GripVertical className="size-4 text-muted-foreground/40" />
            {activeDrag.label}
          </div>
        )}
      </DragOverlay>

      <WorkOrderDetailDrawer workOrderId={detailWoId} open={detailDrawerOpen} onOpenChange={(open) => { setDetailDrawerOpen(open); if (!open) setDetailWoId(null); }} onRefresh={() => fetchData(false)} />

      {/* Admin dialogs */}
      <ShiftReportDialog open={showShiftReport} onOpenChange={setShowShiftReport} />
      <PinSettingsDialog open={showPinSettings} onOpenChange={setShowPinSettings} />
      <VehicleRegistrationDialog open={showVehicleReg} onOpenChange={setShowVehicleReg} />
      <MechanicRegistrationDialog open={showMechanicReg} onOpenChange={setShowMechanicReg} />

      {toast && <ToastMessage message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </DndContext>
  );
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
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
    if (!startedAt) { setDisplay(""); return; }
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
