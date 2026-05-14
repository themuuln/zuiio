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
  CarFront,
  Clock,
  Gauge,
  Loader2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BayViewData } from "@/lib/services/bay-view-service";
import {
  getBayViewData,
  seedWaitingQueue,
} from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { BayListView } from "./_bay-list-view";
import { BaySlot } from "./bay-slot";
import { BayViewToolbar, type ViewMode } from "./bay-view-toolbar";
import { MechanicRoster } from "./mechanic-roster";
import { QuickActions } from "./quick-actions";
import { StatusNotesModal } from "./status-notes-modal";
import { ToastMessage } from "./toast-message";
import { WaitingQueue } from "./waiting-queue";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";

function BayStats({ data }: { data: BayViewData }) {
  const t = useTranslations("bayView");
  const baysWithWork = data.bays.filter((b) => b.workOrder).length;
  const activeMechanics = data.mechanics.filter(
    (m) => m.current_jobs > 0,
  ).length;
  const waitingCount = data.waitingQueue.length;

  return (
    <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Gauge className="size-4 text-primary" />
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {baysWithWork}/{data.bayCount}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("baysActive")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10">
          <Users className="size-4 text-blue-500" />
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {activeMechanics}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("mechanicsWorking")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10">
          <Clock className="size-4 text-amber-500" />
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums leading-tight">
            {waitingCount}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("inQueue")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BayViewClient() {
  const t = useTranslations("bayView");
  const [data, setData] = useState<BayViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: string;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "info" | "error";
  } | null>(null);

  const [currentProfile, setCurrentProfile] = useState<{
    id: string;
    full_name: string | null;
  } | null>(null);
  const [myJobsOnly, setMyJobsOnly] = useState(false);

  const [pendingStatusChange, setPendingStatusChange] = useState<{
    woId: string;
    status: string;
  } | null>(null);

  const [detailWoId, setDetailWoId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const [pendingWoIds, setPendingWoIds] = useState<Record<string, boolean>>({});

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

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      setError(null);
      const result = await getBayViewData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bay view");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const profile = d?.profile ?? d?.data;
        if (profile?.id) {
          setCurrentProfile({
            id: profile.id,
            full_name: profile.full_name ?? null,
          });
        }
      })
      .catch(() => {});

    refreshIntervalRef.current = setInterval(() => fetchData(false), 30000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchData]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 50, tolerance: 8 },
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

  const {
    handleStatusClick,
    handleStatusChangeConfirm,
    handleQuickAssign,
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

  function handleOpenDetail(woId: string) {
    setDetailWoId(woId);
    setDetailDrawerOpen(true);
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <Skeleton key={id} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">{error ?? t("noData")}</p>
        <button
          type="button"
          onClick={() => fetchData(true)}
          className="text-sm text-primary hover:underline"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {t("title")}
                </h1>
                {userIsMechanic && (
                  <Button
                    variant={myJobsOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMyJobsOnly(!myJobsOnly)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {myJobsOnly ? (
                      <UserCheck className="size-3.5" />
                    ) : (
                      <UserPlus className="size-3.5" />
                    )}
                    {myJobsOnly ? t("myJobs") : t("allJobs")}
                  </Button>
                )}
                {confirmSeed ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {t("addDemoVehicles")}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmSeed(false);
                        setSeeding(true);
                        try {
                          const result = await seedWaitingQueue();
                          const msg =
                            result.errors.length > 0
                              ? `Added ${result.created}, errors: ${result.errors.slice(0, 2).join("; ")}${result.errors.length > 2 ? "..." : ""}`
                              : `Added ${result.created} vehicles to queue`;
                          setToast({
                            message: msg,
                            variant:
                              result.errors.length > 0 ? "error" : "info",
                          });
                          fetchData(true);
                        } catch (err) {
                          setToast({
                            message: `Failed: ${err instanceof Error ? err.message : "error"}`,
                            variant: "error",
                          });
                        } finally {
                          setSeeding(false);
                        }
                      }}
                      disabled={seeding}
                      className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {seeding ? t("adding") : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSeed(false)}
                      className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted transition-colors"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSeed(true)}
                    disabled={seeding}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                  >
                    <CarFront className="size-3.5" />
                    {seeding ? t("adding") : t("seedQueue")}
                  </button>
                )}
                {isRefreshing || Object.keys(pendingWoIds).length > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {Object.keys(pendingWoIds).length > 0 ? (
                      <Loader2 className="size-3 animate-spin text-primary/60" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                    {Object.keys(pendingWoIds).length > 0
                      ? t("saving")
                      : t("refreshing")}
                  </div>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {myJobsOnly ? t("myJobsSubtitle") : t("allJobsSubtitle")}
              </p>
            </div>
            <BayViewToolbar
              bayCount={data.bayCount}
              onRefresh={() => fetchData(true)}
              onBayCountChange={handleBayCountChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
          <BayStats data={data} />
        </div>

        {viewMode === "grid" ? (
          <div
            className={cn(
              "grid gap-3",
              "max-h-[calc(100vh-22rem)] overflow-y-auto",
              data.bayCount <= 2
                ? "grid-cols-1 sm:grid-cols-2"
                : data.bayCount <= 4
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            )}
          >
            {filteredBays.map((bay) => (
              <BaySlot
                key={bay.bayNumber}
                bay={bay}
                isPending={!!(bay.workOrder && pendingWoIds[bay.workOrder.id])}
                onStatusChange={handleStatusClick}
                onRemoveFromBay={handleRemoveFromBay}
                onAssignMechanic={async () => {}}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        ) : (
          <BayListView
            bays={filteredBays}
            onStatusClick={handleStatusClick}
            onOpenDetail={handleOpenDetail}
            t={t}
          />
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <QuickActions />
          <MechanicRoster mechanics={data.mechanics} />
          <WaitingQueue
            items={filteredQueue}
            pendingWoIds={pendingWoIds}
            onQuickAssign={handleQuickAssign}
          />
        </div>
      </div>

      {pendingStatusChange && (
        <StatusNotesModal
          woId={pendingStatusChange.woId}
          newStatus={pendingStatusChange.status}
          onConfirm={handleStatusChangeConfirm}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div
            className="rounded-lg border-2 border-primary bg-card px-4 py-2 text-sm font-semibold shadow-xl cursor-grabbing"
            style={{ willChange: "transform" }}
          >
            {activeDrag.label}
          </div>
        )}
      </DragOverlay>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.message ?? ""}
      </div>

      {toast && (
        <ToastMessage
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      <WorkOrderDetailDrawer
        workOrderId={detailWoId}
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open);
          if (!open) setDetailWoId(null);
        }}
        onRefresh={() => fetchData(false)}
      />
    </DndContext>
  );
}
