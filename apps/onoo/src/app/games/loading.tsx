import { Skeleton } from "@/components/ui/skeleton";
import { GameCardSkeleton } from "../components/game-card";

export default function GamesLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тоглолт ачаалж байна"
      aria-busy="true"
    >
      {/* Header + date nav row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex max-w-2xl flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="lg:col-span-5 lg:justify-self-end">
          <Skeleton className="mb-2 h-5 w-24" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
      </div>

      {/* Quick stats bar */}
      <Skeleton className="h-9 w-48 rounded-lg" />

      {/* Game cards grid */}
      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        <GameCardSkeleton />
        <GameCardSkeleton />
      </div>
    </main>
  );
}
