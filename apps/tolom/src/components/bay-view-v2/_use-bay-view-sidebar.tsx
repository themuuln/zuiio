"use client";

import { List, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { BayViewData } from "@/lib/services/bay-view-service";
import type { Vehicle, WorkOrder } from "@/lib/types";
import { MechanicPanel } from "./mechanic-panel";
import { QueuePanel } from "./queue-panel";

export function useBayViewSidebar(
  data: BayViewData | null,
  filteredQueue: (WorkOrder & { vehicle: Vehicle | null })[],
  pendingWoIds: Record<string, boolean>,
  availableBays: number[],
  handleQuickAssign: (workOrderId: string) => void,
  handleQueueItemClick: (wo: WorkOrder & { vehicle: Vehicle | null }) => void,
  handleQuickAssignToBay: (workOrderId: string, bayNumber: number) => void,
) {
  const t = useTranslations("bayView");
  const { registerTab, updateTabContent, unregisterTab } = useRightSidebar();

  // Stable refs for callbacks to avoid effect re-fires
  const handleQuickAssignRef = useRef(handleQuickAssign);
  handleQuickAssignRef.current = handleQuickAssign;
  const handleQueueItemClickRef = useRef(handleQueueItemClick);
  handleQueueItemClickRef.current = handleQueueItemClick;
  const handleQuickAssignToBayRef = useRef(handleQuickAssignToBay);
  handleQuickAssignToBayRef.current = handleQuickAssignToBay;

  // Register once, update content on data changes
  useEffect(() => {
    if (!data) return;
    registerTab(
      "queue",
      t("waitingQueue"),
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={(...args) => handleQuickAssignRef.current(...args)}
        mechanics={data.mechanics}
        onItemClick={(...args) => handleQueueItemClickRef.current(...args)}
        availableBays={availableBays}
        onAssignToBay={(...args) => handleQuickAssignToBayRef.current(...args)}
      />,
      <List className="size-4" />,
    );
    registerTab(
      "mechanics",
      t("mechanics"),
      <MechanicPanel mechanics={data.mechanics} />,
      <Users className="size-4" />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, registerTab, data]);

  // Update content when filteredQueue/pendingWoIds/availableBays change
  useEffect(() => {
    if (!data) return;
    updateTabContent(
      "queue",
      <QueuePanel
        items={filteredQueue}
        pendingWoIds={pendingWoIds}
        onQuickAssign={(...args) => handleQuickAssignRef.current(...args)}
        mechanics={data.mechanics}
        onItemClick={(...args) => handleQueueItemClickRef.current(...args)}
        availableBays={availableBays}
        onAssignToBay={(...args) => handleQuickAssignToBayRef.current(...args)}
      />,
    );
    updateTabContent("mechanics", <MechanicPanel mechanics={data.mechanics} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filteredQueue, pendingWoIds, availableBays, updateTabContent]);

  // Unregister on unmount
  useEffect(() => {
    return () => {
      unregisterTab("queue");
      unregisterTab("mechanics");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unregisterTab]);
}
