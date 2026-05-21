"use client";

import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn } from "@/lib/utils";
import { BayListView } from "./_bay-list-view";
import { BaySlot } from "./bay-slot";
import type { ColumnsMode, ViewMode } from "./bay-view-toolbar";
import type { useTranslations } from "next-intl";

interface BayViewBodyProps {
  bays: BaySlotData[];
  bayCount: number;
  viewMode: ViewMode;
  columns: ColumnsMode;
  pendingWoIds: Record<string, boolean>;
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  t: ReturnType<typeof useTranslations>;
}

export function BayViewBody({
  bays,
  bayCount,
  viewMode,
  columns,
  pendingWoIds,
  onStatusChange,
  onRemoveFromBay,
  onOpenDetail,
  t,
}: BayViewBodyProps) {
  if (viewMode === "grid") {
    return (
      <div
        className={cn(
          "grid gap-1.5 p-1 h-full overflow-y-auto pr-1 [scrollbar-gutter:stable]",
          columns === "2" && "grid-cols-1 sm:grid-cols-2",
          columns === "3" && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
          columns === "auto" &&
            bayCount <= 2 &&
            "grid-cols-1 sm:grid-cols-2",
          columns === "auto" &&
            bayCount > 2 &&
            "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
        )}
      >
        {bays.map((bay) => (
          <BaySlot
            key={bay.bayNumber}
            bay={bay}
            isPending={!!(bay.workOrder && pendingWoIds[bay.workOrder.id])}
            onStatusChange={onStatusChange}
            onRemoveFromBay={onRemoveFromBay}
            onAssignMechanic={async () => {}}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    );
  }

  return (
    <BayListView
      bays={bays}
      onStatusClick={onStatusChange}
      onOpenDetail={onOpenDetail}
      t={t}
    />
  );
}
