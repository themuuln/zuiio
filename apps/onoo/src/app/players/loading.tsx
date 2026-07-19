import { Skeleton } from "@/components/ui/skeleton";

export default function PlayersLoading() {
  const placeholders = Array.from({ length: 8 }, (_, i) => `player-${i}`);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тоглогчид ачаалж байна"
      aria-busy="true"
    >
      {/* Hero header with court motif */}
      <header className="relative overflow-hidden rounded-xl bg-sidebar px-6 py-8 sm:px-10 sm:py-10">
        <div className="relative max-w-2xl" aria-hidden="true">
          <Skeleton className="h-4 w-28 bg-sidebar-foreground/10" />
          <Skeleton className="mt-3 h-12 w-48 bg-sidebar-foreground/10" />
          <Skeleton className="mt-3 h-5 w-full max-w-md bg-sidebar-foreground/10" />
          <Skeleton className="mt-4 h-5 w-24 bg-sidebar-foreground/10" />
        </div>
      </header>

      {/* Player grid */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        {placeholders.map((key) => (
          <Skeleton key={key} className="h-40 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
