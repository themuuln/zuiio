"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { WorkOrderCard } from "@/components/workshop-display/work-order-card";
import { useClientNow } from "@/hooks/use-client-now";
import { useRealtimeMulti } from "@/lib/hooks/use-realtime-multi";
import { workshopDisplayKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useWorkshopDisplay } from "@/lib/queries/use-workshop-display";
import { playReadyNotification } from "@/lib/workshop-display/ready-notification";

const STATUS_DOT_COLORS: Record<string, string> = {
  New: "bg-blue-400 text-blue-400",
  Diagnosing: "bg-amber-400 text-amber-400",
  "In Progress": "bg-emerald-400 text-emerald-400",
  "Ready for Pickup": "bg-violet-400 text-violet-400",
};

export function WorkshopDisplayClient() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? null;
  const {
    data: workOrders,
    isPending,
    error,
  } = useWorkshopDisplay(orgId ?? undefined);

  const realtimeTables = useMemo(
    () => [
      {
        table: "work_orders" as const,
        filter: orgId ? `organization_id=eq.${orgId}` : undefined,
        queryKey: workshopDisplayKeys.workOrders(orgId ?? ""),
      },
    ],
    [orgId],
  );
  useRealtimeMulti({
    enabled: !!orgId,
    tables: realtimeTables,
  });

  const previousStatuses = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!workOrders) return;

    const nextStatuses: Record<string, string> = {};
    let hasNewReadyOrder = false;
    for (const workOrder of workOrders) {
      nextStatuses[workOrder.id] = workOrder.status;
      if (
        workOrder.status === "Ready for Pickup" &&
        previousStatuses.current[workOrder.id] &&
        previousStatuses.current[workOrder.id] !== "Ready for Pickup"
      ) {
        hasNewReadyOrder = true;
      }
    }

    previousStatuses.current = nextStatuses;
    if (hasNewReadyOrder) playReadyNotification();
  }, [workOrders]);
  const now = useClientNow();

  // Count work orders per status for the overview bar
  const statusCounts: Record<string, number> = {};
  if (workOrders) {
    for (const wo of workOrders) {
      statusCounts[wo.status] = (statusCounts[wo.status] ?? 0) + 1;
    }
  }

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white/40" />
          <p className="text-lg text-white/40">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-xl text-red-400">
            {t("common.somethingWentWrong")}
          </p>
          <p className="mt-2 text-sm text-white/40">{error.message}</p>
        </div>
      </div>
    );
  }

  const activeOrders = workOrders ?? [];

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Top status bar */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("workshopDisplay.title")}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span
                key={status}
                className={`flex items-center gap-1.5 ${STATUS_DOT_COLORS[status] ?? "text-white/60"}`}
              >
                <span className="size-2 rounded-full bg-current" />
                {status}
                <span className="font-mono text-white/60">{count}</span>
              </span>
            ))}
            <span className="text-white/30">|</span>
            <span className="text-white/50">
              {activeOrders.length} {t("workshopDisplay.total")}
            </span>
          </div>
        </div>
        <span className="text-lg font-mono tabular-nums text-white/60">
          {now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </header>

      {/* Card grid */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeOrders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-2xl text-white/30">
              {t("workshopDisplay.noActiveOrders")}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(360px,1fr))] auto-rows-max">
            {activeOrders.map((wo) => (
              <WorkOrderCard key={wo.id} workOrder={wo} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
