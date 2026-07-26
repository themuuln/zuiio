import { Skeleton } from "@/components/ui/skeleton";

const pendingCardKeys = ["pending-0", "pending-1"];
const sectionCardKeys = ["section-0", "section-1", "section-2", "section-3"];
const tableRowCounter = [0, 1, 2];
const tableRowPrefix = "table-row";

export default function OpsConsoleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-6 w-40 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {pendingCardKeys.map((key) => (
          <div key={key} className="rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-44 mb-2" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      {sectionCardKeys.map((key) => (
        <div key={key} className="rounded-lg border border-border p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {tableRowCounter.map((n) => (
              <div
                key={`${tableRowPrefix}-${key}-${n}`}
                className="flex items-center gap-4"
              >
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
