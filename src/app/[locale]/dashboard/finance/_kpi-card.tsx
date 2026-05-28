"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  loading?: boolean;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
}: KpiCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              {value}
            </div>
            {subtitle && (
              <Typography.Muted className="mt-1 text-xs text-muted-foreground">{subtitle}</Typography.Muted>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
