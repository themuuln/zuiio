import { Skeleton } from "@/components/ui/skeleton";

const ROWS = Array.from({ length: 5 }, (_, i) => ({
  id: `attendance-row-${i}`,
}));

export default function AcademyAttendanceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <Skeleton className="h-5 flex-[2]" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-5 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
