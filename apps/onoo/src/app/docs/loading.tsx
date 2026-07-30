import { Skeleton } from "@/components/ui/skeleton";

export default function DocsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      aria-label="Баримт бичиг ачаалж байна"
      aria-busy="true"
    >
      <div className="flex gap-8 lg:flex-row">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 flex flex-col gap-6">
            {["g1", "g2", "g3"].map((g) => (
              <div key={g}>
                <Skeleton className="mb-2 h-3 w-24" />
                <ul className="flex flex-col gap-0.5">
                  {["i1", "i2", "i3"].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </main>
      </div>
    </div>
  );
}
