import { Skeleton } from "@/components/ui/skeleton";

const ROWS = Array.from({ length: 5 }, (_, i) => ({ id: `team-row-${i}` }));

export default function TeamsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-5 flex-[2]" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
