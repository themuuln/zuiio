import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  /** Optional title to show as skeleton text (default: no title skeleton) */
  title?: string;
  /** Height of the chart area (default: h-60) */
  height?: string;
  className?: string;
}

/**
 * Reusable chart loading skeleton for use with dynamically imported chart components.
 * Renders a Card with a skeleton title and skeleton chart area.
 */
export function ChartSkeleton({
  title,
  height = "h-60",
  className,
}: ChartSkeletonProps) {
  return (
    <Card className={cn("", className)}>
      {title && (
        <CardHeader>
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        </CardHeader>
      )}
      <CardContent>
        <div
          className={cn("w-full animate-pulse rounded-lg bg-muted", height)}
        />
      </CardContent>
    </Card>
  );
}
