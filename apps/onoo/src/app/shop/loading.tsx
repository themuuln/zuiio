import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Дэлгүүр ачаалж байна"
      aria-busy="true"
    >
      <header className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="mt-3 h-5 w-72" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["p1", "p2", "p3", "p4", "p5", "p6"].map((id) => (
          <div key={id} className="flex flex-col gap-3 rounded-xl border p-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
