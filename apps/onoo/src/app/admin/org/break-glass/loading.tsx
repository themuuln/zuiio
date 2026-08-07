import { Skeleton } from "@/components/ui/skeleton";

const ROWS = Array.from({ length: 5 }, (_, i) => ({
  id: `break-glass-row-${i}`,
}));

export default function BreakGlassLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-5 flex-[2] font-mono" />
            <Skeleton className="h-5 flex-[3]" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
