"use client";

import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryMovement } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import {
  formatDate,
  MOVEMENT_COLORS,
  MOVEMENT_LABELS,
} from "../../_components/constants";

interface StockHistoryProps {
  movements: InventoryMovement[];
  isLoading: boolean;
}

export function StockHistory({ movements, isLoading }: StockHistoryProps) {
  const t = useTranslations("inventory");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t("stockHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-4 p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-4 w-32 flex-1" />
              </div>
            ))}
          </div>
        ) : movements.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>{t("noMovementsForPart")}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="divide-y divide-border">
            {movements.map((m) => {
              const colorClass = MOVEMENT_COLORS[m.movement_type] ?? "";
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-4 min-h-[56px]"
                >
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    {formatDate(m.created_at)}
                  </span>
                  <Badge variant="outline" className={`shrink-0 ${colorClass}`}>
                    {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                  </Badge>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      m.quantity > 0 &&
                      [
                        "purchase",
                        "return",
                        "transfer_in",
                        "adjustment",
                      ].includes(m.movement_type)
                        ? "text-emerald-600"
                        : "text-destructive"
                    }`}
                  >
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </span>
                  {m.unit_cost != null && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      @ {formatMNT(m.unit_cost)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground truncate flex-1 min-w-0 text-right">
                    {m.notes ?? ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
