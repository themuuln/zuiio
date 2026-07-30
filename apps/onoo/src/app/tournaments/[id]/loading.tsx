import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function TournamentLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тэмцээн ачаалж байна"
      aria-busy="true"
    >
      <header className="flex flex-col gap-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-1 h-5 w-40" />
          </div>
          <Skeleton className="ml-auto h-6 w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["b1", "b2", "b3"].map((id) => (
            <Skeleton key={id} className="h-9 w-28" />
          ))}
        </div>
      </header>

      <section>
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
            <Skeleton key={id} className="h-20 rounded-xl" />
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["l1", "l2", "l3", "l4"].map((id) => (
            <Skeleton key={id} className="h-16 rounded-xl" />
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </section>
    </main>
  );
}
