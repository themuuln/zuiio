import { Skeleton } from "@zuiio/ui";
import { Card, CardContent, CardHeader } from "@zuiio/ui";
import { LeaderTabsSkeleton } from "./components/leader-tabs";

export default function LeadersLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тэргүүлэгчид ачаалж байна"
      aria-busy="true"
    >
      {/* Header */}
      <header className="max-w-2xl" aria-hidden="true">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-12 w-48" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Leader tabs area — uses existing skeleton */}
        <div className="lg:col-span-8" aria-hidden="true">
          {/* Tabs list skeleton */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
          <LeaderTabsSkeleton />
        </div>

        {/* MVP race sidebar skeleton */}
        <aside className="lg:col-span-4" aria-hidden="true">
          <Card variant="stat" className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
