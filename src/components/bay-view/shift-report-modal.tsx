"use client";

import { Button } from "@/components/ui/button";
import { Car, Clock, DollarSign, Gauge, Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ShiftReport } from "@/lib/services/bay-view-service";
import { formatMNT } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

export function ShiftReportModal({ onClose }: Props) {
  const t = useTranslations("bayView");
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getShiftReport } = await import(
          "@/lib/services/bay-view-service"
        );
        const data = await getShiftReport();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="size-4 text-emerald-500" />
            {t("shiftReport")}
          </DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        )}

        {report && (
          <div className="flex flex-col gap-5 mt-2">
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-200/50 dark:border-green-800/30 p-3 text-center">
                <div className="flex items-center justify-center size-8 rounded-full bg-green-500/10 mx-auto mb-1.5">
                  <Car className="size-4 text-green-600" />
                </div>
                <div className="text-2xl font-semibold tabular-nums text-green-700 dark:text-green-300">
                  {report.completedToday}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  {t("completedToday")}
                </div>
              </div>
              <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/30 p-3 text-center">
                <div className="flex items-center justify-center size-8 rounded-full bg-blue-500/10 mx-auto mb-1.5">
                  <DollarSign className="size-4 text-blue-600" />
                </div>
                <div className="text-xl font-semibold tabular-nums text-blue-700 dark:text-blue-300 truncate">
                  {formatMNT(report.revenueToday)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                  {t("revenueToday")}
                </div>
              </div>
            </div>

            {/* Detail stats */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  {t("avgJobDuration")}
                </span>
                <span className="font-semibold tabular-nums">
                  {report.avgDurationMinutes > 0
                    ? `${Math.floor(report.avgDurationMinutes / 60)}h ${report.avgDurationMinutes % 60}m`
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Gauge className="size-3.5" />
                  {t("bayUtilization")}
                </span>
                <span className="font-semibold tabular-nums">
                  {report.bayUtilization}%
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    ({report.bayCount} {t("bays")})
                  </span>
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5" />
                  {t("activeJobs")}
                </span>
                <span className="font-semibold tabular-nums">
                  {report.activeJobs}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
