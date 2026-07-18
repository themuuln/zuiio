import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StandingsLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Шалгуур ачаалж байна"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <header className="grid gap-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7 flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
      </header>

      {/* Race cards skeleton */}
      <section aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Card key={i} className="shadow-none">
              <CardHeader>
                <Skeleton className="h-5 w-8" />
                <div className="mt-3 flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Table skeleton */}
      <section aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex flex-col gap-0 rounded-xl border">
          {/* Table header */}
          <div className="grid grid-cols-9 gap-4 border-b px-4 py-3">
            {[32, 80, 32, 32, 48, 32, 56, 64, 48].map((w, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <div
                key={i}
                className="flex justify-center first:justify-start last:justify-end"
              >
                <Skeleton className="h-4" style={{ width: w }} />
              </div>
            ))}
          </div>
          {/* Table rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <div
              key={row}
              className="grid grid-cols-9 gap-4 border-b last:border-b-0 px-4 py-3"
            >
              <Skeleton className="h-4 w-5" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-4 w-5" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-4 w-5" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-4 w-5" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-5 w-12 rounded-md" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
