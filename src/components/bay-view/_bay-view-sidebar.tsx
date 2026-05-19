"use client";

import type { Profile, Vehicle, WorkOrder } from "@/lib/database.types";
import { MechanicRoster } from "./mechanic-roster";
import { WaitingQueue } from "./waiting-queue";

interface BayViewSidebarProps {
  items: (WorkOrder & { vehicle: Vehicle | null })[];
  mechanics: (Profile & { current_jobs: number })[];
  pendingWoIds: Record<string, boolean>;
  onQuickAssign?: (workOrderId: string) => void;
  onItemClick?: (workOrder: WorkOrder & { vehicle: Vehicle | null }) => void;
}

export function BayViewSidebar({
  items,
  mechanics,
  pendingWoIds,
  onQuickAssign,
  onItemClick,
}: BayViewSidebarProps) {
  return (
    <div className="flex h-full flex-col border-t md:border-t-0 md:border-l border-border/50">
      <div className="flex-1 overflow-y-auto">
        <WaitingQueue
          items={items}
          pendingWoIds={pendingWoIds}
          onQuickAssign={onQuickAssign}
          mechanics={mechanics}
          onItemClick={onItemClick}
        />
        <div className="border-t border-border/50 mx-2" />
        <MechanicRoster mechanics={mechanics} />
      </div>
    </div>
  );
}
