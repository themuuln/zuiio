"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useBayViewContext } from "./bay-view-provider";
import {
  useAnyDialogOpen,
  useBaySearchQuery,
  useBayViewMode,
  useBayViewStore,
  useMyJobsOnly,
} from "@/lib/stores/bay-view-store";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { BayViewErrorState } from "./_error-state";
import { ErrorSection } from "./_error-section";
import { GridView } from "./_grid-view";
import { KanbanView } from "./_kanban-view";
import { KpiCards } from "./_kpi-cards";
import { ListView } from "./_list-view";
import { Toolbar } from "./_toolbar";
import { DialogManager } from "./_dialog-manager";
import { WorkOrderDetailDrawer } from "./work-order-detail-drawer";
import { useBayActionHandlers } from "./_bay-action-handlers";
import { useBayDragHandlers } from "./_bay-drag-handlers";
import { DndContext, DragOverlay, useSensor, useSensors } from "@dnd-kit/core";
import { GuardedPointerSensor, GuardedTouchSensor } from "./_types";
import { BayCardDragPreview } from "./bay-card";
import { ErrorBoundary } from "@/components/error-boundary";
import { formatPlateNumber } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export function BayViewContent() {
  const t = useTranslations("bayView");
  const {
    data,
    loading,
    error,
    fetchData,
    currentProfile,
    activeDrag,
    setActiveDrag,
  } = useBayViewContext();

  const viewMode = useBayViewMode();
  const myJobsOnly = useMyJobsOnly();
  const baySearchQuery = useBaySearchQuery();
  const assignBay = useBayViewStore((s) => s.assignBay);
  const pendingWoIds = useBayViewStore((s) => s.pendingWoIds);
  const detailDrawerOpen = useBayViewStore((s) => s.detailDrawerOpen);
  const detailWoId = useBayViewStore((s) => s.detailWoId);
  const drawerInitialAction = useBayViewStore((s) => s.drawerInitialAction);

  // ── Drag handlers ──
  const pointerSensor = useSensor(GuardedPointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(GuardedTouchSensor, {
    activationConstraint: { delay: 300, tolerance: 20 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const { handleDragStart, handleDragEnd } = useBayDragHandlers({
    setData: useBayViewContext().setData,
    setActiveDrag,
    markPending: (...ids) => useBayViewStore.getState().markPending(...ids),
    clearPending: (...ids) => useBayViewStore.getState().clearPending(...ids),
  });

  const actionHandlers = useBayActionHandlers({
    queryClient: useQueryClient(),
    data,
    setData: useBayViewContext().setData,
    markPending: (...ids) => useBayViewStore.getState().markPending(...ids),
    clearPending: (...ids) => useBayViewStore.getState().clearPending(...ids),
    fetchData,
  });

  // ── Search filtering ──
  const filteredBays = useFuzzySearch(
    myJobsOnly
      ? (data?.bays.map((bay) => {
          if (!bay.workOrder) return bay;
          const isMain = bay.workOrder.mechanic?.id === currentProfile?.id;
          return {
            workOrder: isMain ? bay.workOrder : null,
          };
        }) ?? [])
      : (data?.bays ?? []),
    baySearchQuery,
    {
      keys: [
        "workOrder.vehicle.plate_number",
        "workOrder.vehicle.make",
        "workOrder.vehicle.model",
        "workOrder.customer_name",
        "workOrder.mechanic.full_name",
        "workOrder.status",
      ],
      threshold: 0.4,
    },
  );

  // ── Loading / Error states ──
  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return <BayViewErrorState error={error} t={t} fetchData={fetchData} />;
  }

  // ── Render ──
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="flex h-full flex-col bg-muted/20 overflow-hidden rounded-2xl border border-border/40 shadow-sm">
        <ErrorSection label="Toolbar">
          <Toolbar fetchData={fetchData} data={data} />
        </ErrorSection>

        <KpiCards
          shiftReport={useBayViewContext().shiftReport}
          occupiedBays={data.bays.filter((b) => b.workOrder).length}
          bayCount={data.bayCount}
          waitingQueueLength={data.waitingQueue.length}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/5">
          <ErrorSection>
            {viewMode === "grid" && (
              <GridView
                bays={filteredBays}
                pendingWoIds={pendingWoIds}
                onStatusChange={actionHandlers.handleStatusClick}
                onRemoveFromBay={actionHandlers.handleRemoveFromBay}
                onOpenDetail={actionHandlers.handleOpenDetail}
                onAssignClick={(n) =>
                  useBayViewStore.getState().setAssignBay(n)
                }
                orgId={orgInfo?.orgId}
              />
            )}
            {viewMode === "kanban" && (
              <KanbanView
                searchedBays={filteredBays}
                assignableBays={data.bays}
                queue={data.waitingQueue}
                pendingWoIds={pendingWoIds}
                onStatusChange={actionHandlers.handleStatusClick}
                onRemoveFromBay={actionHandlers.handleRemoveFromBay}
                onOpenDetail={actionHandlers.handleOpenDetail}
                onAssignClick={(n) =>
                  useBayViewStore.getState().setAssignBay(n)
                }
                onNoEmptyBays={() =>
                  useBayViewStore.getState().setToast({
                    msg: "No empty bays available",
                    variant: "error",
                  })
                }
                onQueueItemClick={actionHandlers.handleQueueItemClick}
                orgId={orgInfo?.orgId}
              />
            )}
            {viewMode === "list" && (
              <ListView
                bays={filteredBays}
                onOpenDetail={actionHandlers.handleOpenDetail}
                onAssignClick={(n) =>
                  useBayViewStore.getState().setAssignBay(n)
                }
                orgId={orgInfo?.orgId}
              />
            )}
          </ErrorSection>
        </div>

        <DialogManager
          data={data}
          fetchData={fetchData}
          actionHandlers={actionHandlers}
        />

        <ErrorBoundary>
          <WorkOrderDetailDrawer
            workOrderId={detailWoId}
            open={detailDrawerOpen}
            onOpenChange={(open) => {
              if (!open) useBayViewStore.getState().closeDetail();
            }}
            onRefresh={() => fetchData(false)}
            initialAction={drawerInitialAction}
          />
        </ErrorBoundary>
      </div>

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
    </DndContext>
  );
}
