import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerDetailLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тоглогчийн мэдээлэл ачаалж байна"
      aria-busy="true"
    >
      <section
        className="player-showcase-hero rounded-2xl p-6 md:p-8"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-4">
            {["s1", "s2", "s3", "s4"].map((id) => (
              <div key={id} className="flex flex-col items-center gap-1">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <section aria-hidden="true">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="flex gap-3 overflow-hidden">
          {["g1", "g2", "g3", "g4", "g5"].map((id) => (
            <Skeleton key={id} className="h-24 w-32 shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  );
}
