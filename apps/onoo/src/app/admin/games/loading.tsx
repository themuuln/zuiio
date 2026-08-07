import { Skeleton } from "@/components/ui/skeleton";

const ROWS = Array.from({ length: 5 }, (_, i) => ({ id: `game-row-${i}` }));

export default function GamesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-5 flex-[2]" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
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
