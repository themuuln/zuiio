"use client";

import { Clock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStockCountSession } from "@/lib/queries/use-stock-counts";

// ── Status Badge Config ────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { labelKey: string; color: string; icon: typeof Clock }
> = {
  in_progress: {
    labelKey: "sessionInProgress",
    color:
      "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  completed: {
    labelKey: "sessionCompleted",
    color:
      "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    icon: Clock,
  },
  cancelled: {
    labelKey: "sessionCancelled",
    color: "bg-destructive/10 text-destructive",
    icon: Clock,
  },
};

// ── Props ──────────────────────────────────────────────────────

interface StockCountDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  sessionId: string;
}

// ── Variance Text Helper ───────────────────────────────────────

const varianceText = (variance: number) => {
  if (variance === 0) return "—";
  return variance > 0 ? `+${variance}` : `${variance}`;
};

// ── Component ──────────────────────────────────────────────────

export function StockCountDetailDrawer({
  open,
  onOpenChange,
  orgId,
  sessionId,
}: StockCountDetailDrawerProps) {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: session, isPending } = useStockCountSession(orgId, sessionId);

  const loadingState = isPending || !session;

  if (!open) return null;

  if (loadingState) {
    return (
      <DetailDrawer open={open} onOpenChange={onOpenChange}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </DetailDrawer>
    );
  }

  const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
  const StatusIcon = statusCfg.icon;
  const items = session.items ?? [];

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2">
          {t("countDetail")}
          <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
            <StatusIcon className="mr-1 size-3" />
            {t(statusCfg.labelKey)}
          </Badge>
        </DetailDrawer.Title>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {/* Meta info */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>
            {t("countSessionStarted", {
              date: new Date(session.started_at).toLocaleDateString("mn-MN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            })}
          </span>
          <span>
            {t("items")}: {session.total_items}
          </span>
          {session.total_variance !== 0 && (
            <span
              className={
                session.total_variance > 0 ? "text-amber-600" : "text-red-600"
              }
            >
              {t("variance")}: {session.total_variance > 0 ? "+" : ""}
              {session.total_variance}
            </span>
          )}
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {session.notes}
          </div>
        )}

        {/* Items table */}
        {items.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("part")}</TableHead>
                  <TableHead className="text-right">
                    {t("systemQuantity")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("physicalQuantity")}
                  </TableHead>
                  <TableHead className="text-right">{t("variance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const itemVariance =
                    item.variance ??
                    item.physical_quantity - item.system_quantity;
                  const hasVariance = itemVariance !== 0;
                  return (
                    <TableRow
                      key={item.id}
                      className={
                        hasVariance ? "bg-amber-50 dark:bg-amber-950/10" : ""
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {item.part_name ?? "—"}
                          </span>
                          {item.part_number && (
                            <span className="text-xs text-muted-foreground">
                              {item.part_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {item.system_quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {item.physical_quantity}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-semibold ${
                          hasVariance
                            ? itemVariance > 0
                              ? "text-amber-600"
                              : "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {varianceText(itemVariance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty items state */}
        {items.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t("noItems")}
          </div>
        )}
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions justify="end">
          <Button onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
