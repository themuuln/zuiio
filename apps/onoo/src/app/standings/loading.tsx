import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function StandingsLoading() {
  const raceCards = ["rank-1", "rank-2", "rank-3"];
  const tableRows = Array.from({ length: 8 }, (_, i) => `row-${i}`);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Шалгуур ачаалж байна"
      aria-busy="true"
    >
      {/* Header */}
      <header className="flex flex-col gap-4" aria-hidden="true">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-12 w-48" />
          <Skeleton className="mt-3 h-5 w-full max-w-lg" />
        </div>
      </header>

      {/* Top 3 race cards */}
      <section
        className="rounded-xl bg-[var(--surface-1)] p-6 sm:p-8"
        aria-hidden="true"
      >
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-7 w-40" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {raceCards.map((key) => (
            <Card key={key} className="shadow-none">
              <CardHeader>
                <Skeleton className="h-5 w-8" />
                <div className="mt-3 flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 flex-col gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Full standings table */}
      <section aria-hidden="true">
        <Skeleton className="h-7 w-32 mb-4" />
        <Card className="shadow-none">
          <CardContent className="p-0 space-y-0">
            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-3 border-b">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
            </div>
            {tableRows.map((key) => (
              <div
                key={key}
                className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
              >
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
