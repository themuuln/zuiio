"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-skeleton rounded-lg bg-surface-2 ${className}`}
    />
  );
}

export function SkeletonCard({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="border border-border rounded-xl bg-surface overflow-hidden"
      style={{ width }}
    >
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Skeleton className="h-5 w-5 rounded-md" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-md" />
      <Skeleton className="h-5 w-16 rounded-md" />
    </div>
  );
}

export function CanvasSkeleton() {
  return (
    <div className="flex-1 h-full flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Skeleton className="h-24 w-32 rounded-xl" />
          <div className="absolute -top-2 -right-2">
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="border border-border rounded-xl bg-surface p-4 space-y-2">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-2 w-16" />
    </div>
  );
}
