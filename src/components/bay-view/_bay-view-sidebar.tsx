"use client";

import { Clock, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Vehicle, WorkOrder } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { MechanicRoster } from "./mechanic-roster";
import { WaitingQueue } from "./waiting-queue";

type SidebarTab = "queue" | "mechanics";

interface BayViewSidebarProps {
  items: (WorkOrder & { vehicle: Vehicle | null })[];
  mechanics: { id: string; full_name: string | null; current_jobs: number }[];
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
  const t = useTranslations("bayView");
  const [tab, setTab] = useState<SidebarTab>("queue");
  const queueCount = items.length;
  const activeMechanics = mechanics.filter((m) => m.current_jobs > 0).length;

  return (
    <div className="flex h-full flex-col border-t md:border-t-0 md:border-l border-border/50">
      <div className="flex border-b border-border/50">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-colors",
            tab === "queue"
              ? "border-b-2 border-primary text-foreground bg-muted/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/10",
          )}
        >
          <Clock className="size-3.5" />
          <span>{t("waitingQueue")}</span>
          {queueCount > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                queueCount > 5
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
              )}
            >
              {queueCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("mechanics")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-colors",
            tab === "mechanics"
              ? "border-b-2 border-primary text-foreground bg-muted/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/10",
          )}
        >
          <Users className="size-3.5" />
          <span>{t("mechanics")}</span>
          {activeMechanics > 0 && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {activeMechanics}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "queue" ? (
          <WaitingQueue
            items={items}
            pendingWoIds={pendingWoIds}
            onQuickAssign={onQuickAssign}
            mechanics={mechanics}
            onItemClick={onItemClick}
          />
        ) : (
          <MechanicRoster mechanics={mechanics} />
        )}
      </div>
    </div>
  );
}
