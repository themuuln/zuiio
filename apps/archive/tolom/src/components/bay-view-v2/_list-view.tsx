"use client";

import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prefetchDrawerData } from "@/lib/queries/use-drawer-queries";
import type { BaySlotData } from "@/lib/services/bay-view-service";
import { cn, formatPlateNumber } from "@/lib/utils";
import { STATUS_BADGE_CLASS } from "./_constants";
import { ElapsedText } from "./_elapsed-display";

interface ListViewProps {
  bays: BaySlotData[];
  onOpenDetail: (woId: string) => void;
  onAssignClick: (bayNumber: number) => void;
  orgId?: string | null;
  t: (key: string) => string;
}

export const ListView = React.memo(function ListView({
  bays,
  onOpenDetail,
  onAssignClick,
  orgId,
  t,
}: ListViewProps) {
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleRowHover = useCallback(
    (woId: string | undefined) => {
      if (woId && orgId) {
        clearTimeout(prefetchTimerRef.current);
        prefetchTimerRef.current = setTimeout(() => {
          prefetchDrawerData(queryClient, orgId, woId);
        }, 200);
      }
    },
    [orgId, queryClient],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(prefetchTimerRef.current);
  }, []);

  return (
    <div className="p-4 overflow-y-auto w-full h-full">
      <Card className="py-0 bg-card/75 backdrop-blur border-border/50 rounded-xl overflow-hidden">
        <Table className="text-xs">
          <TableHeader className="bg-muted/40 select-none">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75 pl-4 py-3">
                {t("listHeaderBay")}
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75 py-3">
                {t("listHeaderStatus")}
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75 py-3">
                {t("listHeaderVehicle")}
              </TableHead>
              <TableHead className="hidden text-xs font-bold uppercase tracking-wider text-muted-foreground/75 sm:table-cell py-3">
                {t("listHeaderModel")}
              </TableHead>
              <TableHead className="hidden text-xs font-bold uppercase tracking-wider text-muted-foreground/75 md:table-cell py-3">
                {t("listHeaderMechanic")}
              </TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/75 pr-4 py-3">
                {t("listHeaderTime")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bays.map((bay) => {
              const wo = bay.workOrder;
              const v = wo?.vehicle;
              const isEmpty = !wo;
              return (
                <TableRow
                  key={bay.bayNumber}
                  onClick={() =>
                    wo ? onOpenDetail(wo.id) : onAssignClick(bay.bayNumber)
                  }
                  onMouseEnter={() => handleRowHover(wo?.id)}
                  className={cn(
                    "border-b border-border/30 transition-colors cursor-pointer",
                    wo
                      ? "hover:bg-muted/30"
                      : "text-muted-foreground/50 hover:bg-primary/5 hover:border-primary/20",
                  )}
                >
                  <TableCell className="font-semibold pl-4 py-3 font-mono">
                    #{String(bay.bayNumber).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="py-3">
                    {wo ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs uppercase tracking-wider font-bold py-1 px-2 rounded-full",
                          STATUS_BADGE_CLASS[wo.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {wo.status}
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                        <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                        {t("emptyBay")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {wo && v ? (
                      <span className="font-mono text-xs font-bold">
                        {formatPlateNumber(v.plate_number)}
                      </span>
                    ) : wo ? (
                      "—"
                    ) : (
                      <span className="text-xs font-medium text-primary/70">
                        + {t("clickToAssign")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-foreground font-bold sm:table-cell py-3">
                    {wo && v ? (
                      `${v.make} ${v.model}`
                    ) : isEmpty ? (
                      <span className="text-xs text-muted-foreground/40">
                        Empty bay
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {wo?.mechanic ? (
                        <Badge
                          variant="outline"
                          className="bg-muted border-border/60 font-medium py-1 px-2 text-xs rounded-full"
                        >
                          {wo.mechanic.full_name}
                        </Badge>
                      ) : wo ? (
                        <span className="text-xs text-muted-foreground/50">
                          Unassigned
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">
                          —
                        </span>
                      )}
                      {(() => {
                        if (!wo) return null;
                        const helpers = (
                          wo as unknown as Record<string, unknown>
                        ).helpers as
                          | {
                              id: string;
                              full_name: string | null;
                              avatar_url: string | null;
                            }[]
                          | undefined;
                        if (!helpers || helpers.length === 0) return null;
                        return helpers.map((h) => (
                          <Badge
                            key={h.id}
                            variant="outline"
                            className="bg-muted border-border/60 font-medium py-1 px-2 text-xs rounded-full"
                          >
                            {h.full_name ?? "?"}
                          </Badge>
                        ));
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium tabular-nums pr-4 py-3 text-muted-foreground">
                    {wo ? (
                      <ElapsedText startedAt={wo.started_at ?? wo.created_at} />
                    ) : (
                      <span className="text-xs text-primary/60 font-medium">
                        Assign →
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
});
