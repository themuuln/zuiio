import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GamesLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header skeleton */}
      <div className="grid gap-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-10 w-56" />
          <Skeleton className="mt-3 h-4 w-80" />
        </div>
        <div className="lg:col-span-5 lg:justify-self-end">
          <Skeleton className="mb-2 h-4 w-28" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Game group skeletons */}
      <div className="flex flex-col gap-10">
        {[1, 2].map((group) => (
          <div key={group} className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-1 h-7 w-40" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((card) => (
                <Card key={card} className="shadow-none">
                  <CardHeader>
                    <Skeleton className="h-5 w-28" />
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 items-center gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
