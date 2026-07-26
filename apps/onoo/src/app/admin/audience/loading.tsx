import { Skeleton } from "@/components/ui/skeleton";

const statCardKeys = ["stat-0", "stat-1", "stat-2", "stat-3"];
const topCardKeys = ["top-0", "top-1"];
const topRowCounter = [0, 1, 2, 3, 4];
const topRowPrefix = "top-row";

export default function AudienceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-52" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCardKeys.map((key) => (
          <div key={key} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-72 w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {topCardKeys.map((key) => (
          <div key={key} className="rounded-lg border border-border p-4">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {topRowCounter.map((n) => (
                <div
                  key={`${topRowPrefix}-${key}-${n}`}
                  className="flex items-center gap-3"
                >
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
