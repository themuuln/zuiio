import { Card, CardContent, CardHeader } from "@/components/ui";
import { Skeleton } from "@/components/ui";

export default function GameDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* Scoreboard hero skeleton */}
      <section className="overflow-hidden rounded-3xl bg-sidebar p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="mt-8 grid grid-cols-3 items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="text-center">
            <Skeleton className="mx-auto h-16 w-40" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>
      </section>

      {/* Content skeletons */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="shadow-none lg:col-span-7">
          <CardHeader>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-1 h-7 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-2 h-8 w-3/4" />
            <Skeleton className="mt-4 h-4 w-64" />
          </CardContent>
        </Card>
        <Card className="shadow-none lg:col-span-5">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Box score skeleton */}
      <Card className="shadow-none">
        <CardHeader>
          <Skeleton className="h-7 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
