/**
 * TargetCard — Revenue goal with progress bar.
 *
 * Shows: actual vs target, progress percentage, achievement status.
 * If no target is set, shows a dashed card with a "Set Target" button.
 */
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportTarget } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return formatCurrency(n);
}

interface TargetCardProps {
  targets: ReportTarget[];
  loading?: boolean;
  onSetTarget?: () => void;
}

export function TargetCard({ targets, loading, onSetTarget }: TargetCardProps) {
  if (loading) return <Skeleton className="h-[100px] rounded-xl" />;

  const target = targets[0];
  if (!target) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
          <Target className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            No revenue target set
          </span>
          {onSetTarget && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetTarget}
              className="mt-1"
            >
              Set Target
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const progressPct = Math.min(100, target.progress_pct);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Target className="size-4 text-muted-foreground" />
          Revenue Target
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {formatCompact(target.actual_revenue)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatCompact(target.target_revenue)}
          </span>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{target.progress_pct}% achieved</span>
            {target.achieved && (
              <span className="font-medium text-green-600 dark:text-green-400">
                ✓ Target met!
              </span>
            )}
          </div>
          <Progress
            value={progressPct}
            className={`h-2 ${target.achieved ? "[&>div]:bg-green-500" : ""}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
