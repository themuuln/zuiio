import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AwardsLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Наградууд ачаалж байна"
      aria-busy="true"
    >
      {/* Header */}
      <header className="max-w-2xl" aria-hidden="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-12 w-40" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
      </header>

      {/* Player of the Week card */}
      <Card className="shadow-none" aria-hidden="true">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Skeleton className="size-28 rounded-full" />
            <div className="flex-1 flex flex-col items-center gap-4 sm:items-start">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex gap-3">
                {["pts", "reb", "ast", "stl", "blk"].map((stat) => (
                  <Skeleton key={stat} className="h-14 w-14 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MVP Race section */}
      <div aria-hidden="true">
        <Skeleton className="h-7 w-36 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {["mvp-1", "mvp-2", "mvp-3"].map((key) => (
            <Card key={key} className="shadow-none">
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="size-16 rounded-full" />
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
