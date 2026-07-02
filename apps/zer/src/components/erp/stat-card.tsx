import type * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card size="sm" className={cn("", className)}>
      <div className="flex items-start justify-between px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                trend.direction === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              <span>{trend.direction === "up" ? "\u2191" : "\u2193"}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
