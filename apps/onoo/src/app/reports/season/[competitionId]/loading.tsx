import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SeasonReportLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Улирлын тайлан ачаалж байна"
      aria-busy="true"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-8 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </header>

      <section className="court-divider rounded-xl bg-[var(--surface-1)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-9 w-56" />
            <Skeleton className="mt-2 h-5 w-36" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {["s1", "s2", "s3"].map((id) => (
          <Card key={id} className="shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="flex flex-col gap-2">
          {["t1", "t2", "t3", "t4", "t5"].map((id) => (
            <Skeleton key={id} className="h-12 w-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
