"use client";

import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { StockCountDetailDrawer } from "@/components/inventory/stock-count/detail-drawer";
import { StartCountDrawer } from "@/components/inventory/stock-count/start-count-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useStockCountSessions } from "@/lib/queries/use-stock-counts";

const STATUS_COLORS: Record<string, string> = {
  in_progress:
    "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  completed:
    "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const color = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  const labelKey =
    status === "in_progress"
      ? "sessionInProgress"
      : status === "completed"
        ? "sessionCompleted"
        : status === "cancelled"
          ? "sessionCancelled"
          : status;
  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {t(labelKey)}
    </Badge>
  );
}

export function StockCountsPage() {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: sessions = [], isPending } = useStockCountSessions(orgId);

  const [startDrawerOpen, setStartDrawerOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("stockCountTitle")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("stockCountSubtitle")}
          </Typography.Muted>
        </div>
        <Button size="default" onClick={() => setStartDrawerOpen(true)}>
          <Plus className="size-5" /> {t("startCount")}
        </Button>
      </div>

      {/* Sessions list */}
      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-4 p-4 min-h-[64px]"
                >
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>{t("noStockCounts")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setStartDrawerOpen(true)}>
                  {t("startFirstCount")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                  className="flex w-full items-center gap-4 p-4 min-h-[64px] text-left hover:bg-accent/50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-28 shrink-0">
                    {new Date(session.started_at).toLocaleDateString("mn-MN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <StatusBadge status={session.status} />
                  <span className="text-sm text-muted-foreground shrink-0">
                    {session.total_items} {t("items")}
                  </span>
                  {session.total_variance !== 0 && (
                    <span
                      className={`text-sm tabular-nums shrink-0 ${
                        session.total_variance > 0
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {session.total_variance > 0 ? "+" : ""}
                      {session.total_variance}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                    {session.notes ?? ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Count Drawer */}
      <StartCountDrawer
        open={startDrawerOpen}
        onOpenChange={setStartDrawerOpen}
        orgId={orgId ?? ""}
      />

      {/* Detail Drawer */}
      <StockCountDetailDrawer
        open={!!selectedSessionId}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null);
        }}
        orgId={orgId ?? ""}
        sessionId={selectedSessionId ?? ""}
      />
    </div>
  );
}
