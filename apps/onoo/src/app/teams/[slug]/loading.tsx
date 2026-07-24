import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
      aria-label="Ачаалж байна"
      aria-busy="true"
    >
      {/* Hero skeleton */}
      <section className="relative overflow-hidden rounded-3xl bg-sidebar p-6 sm:p-8 lg:p-10">
        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div
            className="flex items-center gap-5 lg:col-span-7"
            aria-hidden="true"
          >
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div
            className="grid grid-cols-3 gap-3 lg:col-span-5"
            aria-hidden="true"
          >
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Next game + form skeletons */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7" aria-hidden="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <Card className="shadow-none lg:col-span-5" aria-hidden="true">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Skeleton className="size-11" />
              <Skeleton className="size-11" />
              <Skeleton className="size-11" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaders skeleton */}
      <div aria-hidden="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1 h-8 w-48" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
