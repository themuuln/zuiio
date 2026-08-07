import { Skeleton } from "@/components/ui/skeleton";

const ROWS = Array.from({ length: 5 }, (_, i) => ({ id: `box-row-${i}` }));

export default function BoxEntryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="rounded-lg border border-border">
          <div className="border-b border-border p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          {ROWS.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
            >
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 flex-[2]" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
