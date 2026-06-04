"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
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
import { ElapsedText } from "./_elapsed-text";
import { STATUS_BADGE_CLASS } from "./bay-card";

interface ListViewProps {
  bays: BaySlotData[];
  onOpenDetail: (woId: string) => void;
  onAssignClick: (bayNumber: number) => void;
  orgId?: string | null;
  t: (key: string) => string;
}

export function ListView({
  bays,
  onOpenDetail,
  onAssignClick,
  orgId,
  t,
}: ListViewProps) {
  const queryClient = useQueryClient();

  const handleRowHover = useCallback(
    (woId: string | undefined) => {
      if (woId && orgId) {
        prefetchDrawerData(queryClient, orgId, woId);
      }
    },
    [orgId, queryClient],
  );

  return (
    <div className="p-4 overflow-y-auto w-full h-full">
      <Card className="bg-card/75 backdrop-blur border-border/50 shadow-sm rounded-xl overflow-hidden">
        <Table className="text-xs">
          <TableHeader className="bg-muted/40 select-none">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 pl-4 py-3">
                {t("listHeaderBay")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 py-3">
                {t("listHeaderStatus")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 py-3">
                {t("listHeaderVehicle")}
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 sm:table-cell py-3">
                {t("listHeaderModel")}
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 md:table-cell py-3">
                {t("listHeaderMechanic")}
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 pr-4 py-3">
                {t("listHeaderTime")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bays.map((bay) => {
              const wo = bay.workOrder;
              const v = wo?.vehicle;
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
                      : "text-muted-foreground/50 hover:bg-accent/30",
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
                          "text-[9px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full",
                          STATUS_BADGE_CLASS[wo.status],
                        )}
                      >
                        {wo.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/40 font-medium">
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
                      <span className="text-[10px] italic text-muted-foreground/40 font-medium">
                        {t("clickToAssign")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-foreground font-bold sm:table-cell py-3">
                    {wo && v ? `${v.make} ${v.model}` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {wo?.mechanic ? (
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40 font-medium py-0.5 px-2 text-[10px] rounded-full"
                        >
                          {wo.mechanic.full_name}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50">
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
                            className="bg-amber-50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 font-medium py-0.5 px-2 text-[10px] rounded-full"
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
                      "—"
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
}
