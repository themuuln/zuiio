import { Skeleton } from "@/components/ui/skeleton";

export default function OrgLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="rounded-lg border border-border p-6">
        <div className="mb-4">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 flex-[2]" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
