/**
 * ReportKpiCard — KPI display card with optional delta indicator and subtitle.
 *
 * Reusable across dashboard, reports, and any metric display.
 * Shows: icon, label, value (with optional delta arrow), subtitle.
 */
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { DeltaIndicator } from "./delta-indicator";

interface ReportKpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  loading?: boolean;
  /** Extra CSS class for the value (e.g., color). */
  cls?: string;
  /** Delta vs previous period — shows trend arrow. */
  delta?: number | null;
  /** Invert delta colors (for metrics where down is good). */
  deltaInvert?: boolean;
}

export function ReportKpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
  cls,
  delta,
  deltaInvert,
}: ReportKpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <div
                className={`text-2xl font-semibold tabular-nums ${cls ?? ""}`}
              >
                {value}
              </div>
              {delta !== undefined && (
                <DeltaIndicator value={delta ?? null} invert={deltaInvert} />
              )}
            </div>
            {subtitle && (
              <Typography.Muted className="mt-0.5 text-xs text-muted-foreground">
                {subtitle}
              </Typography.Muted>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
