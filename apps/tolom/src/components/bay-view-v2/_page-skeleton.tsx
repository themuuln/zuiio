import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page-level skeleton shown while the bay view client component loads
 * via next/dynamic. Matches the exact visual layout of the rendered view
 * so the transition from skeleton → content is seamless.
 *
 * Used by: bay-view/page.tsx
 */
export function BayViewPageSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-1.5">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-5 w-6 rounded" />
          <Skeleton className="size-8 rounded" />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="flex flex-col lg:flex-row shrink-0 max-h-28">
        <KpiCardSkeleton hasProgress />
        <Separator orientation="vertical" className="hidden lg:block" />
        <KpiCardSkeleton valueSuffix="active" subtitle="in waiting queue" />
        <Separator orientation="vertical" className="hidden lg:block" />
        <KpiCardSkeleton valueSuffix="completed" subtitle="Avg duration" />
        <Separator orientation="vertical" className="hidden lg:block" />
        <KpiCardSkeleton subtitle="Today's invoices paid" />
      </div>

      {/* ── Branch Section ── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      {/* ── Bay Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-4 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <BayCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ── KPI card skeleton ── */
function KpiCardSkeleton({
  hasProgress,
  valueSuffix,
  subtitle,
}: {
  hasProgress?: boolean;
  valueSuffix?: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-transparent border-none ring-0 shadow-none px-5 py-4 gap-0 flex flex-col rounded-none flex-1 min-w-0 min-h-[88px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-20 rounded" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-6 w-12 rounded" />
        {valueSuffix && <Skeleton className="h-2.5 w-10 rounded" />}
      </div>
      {hasProgress && <Skeleton className="h-1.5 w-full rounded-full" />}
      {subtitle && <Skeleton className="h-2.5 w-24 rounded" />}
    </Card>
  );
}

/* ── Bay card skeleton — matches empty bay card with centered circle + text ── */
function BayCardSkeleton() {
  return (
    <Card className="relative min-h-[160px] flex flex-col border-dashed border-muted-foreground/30 bg-muted/10 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-muted/10" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-2 w-24 rounded" />
        </div>
      </div>
    </Card>
  );
}
