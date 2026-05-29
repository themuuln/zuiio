/**
 * InsightAlerts — Color-coded alert cards from automated report analysis.
 *
 * Shows positive/warning/danger/info insights with icons and actionable suggestions.
 */
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportInsight } from "@/lib/types";

const SEVERITY_CONFIG = {
  positive: {
    bg: "bg-green-50/50 dark:bg-green-950/20",
    border: "border-green-200/50 dark:border-green-800/30",
    Icon: CheckCircle2,
    iconColor: "text-green-500",
  },
  warning: {
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    border: "border-amber-200/50 dark:border-amber-800/30",
    Icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  danger: {
    bg: "bg-red-50/50 dark:bg-red-950/20",
    border: "border-red-200/50 dark:border-red-800/30",
    Icon: AlertTriangle,
    iconColor: "text-red-500",
  },
  info: {
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "border-blue-200/50 dark:border-blue-800/30",
    Icon: Info,
    iconColor: "text-blue-500",
  },
} as const;

interface InsightAlertsProps {
  insights: ReportInsight[];
  loading?: boolean;
}

export function InsightAlerts({ insights, loading }: InsightAlertsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[80px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!insights.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => {
        const config = SEVERITY_CONFIG[insight.severity];
        const { Icon } = config;
        return (
          <Card key={insight.id} className={`${config.bg} ${config.border}`}>
            <CardContent className="px-4 py-3">
              <div className="flex items-start gap-2">
                <Icon
                  className={`mt-0.5 size-4 shrink-0 ${config.iconColor}`}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold">{insight.title}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {insight.message}
                  </span>
                  {insight.action && (
                    <span className="mt-0.5 text-[11px] italic text-muted-foreground/70">
                      {insight.action}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
