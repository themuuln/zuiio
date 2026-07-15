import { Skeleton } from "@/components/ui/skeleton";
import { GameCardSkeleton } from "./components/game-card";

export default function PublicLoading() {
  const placeholders = ["summary-one", "summary-two", "summary-three"];

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Ачаалж байна"
      aria-busy="true"
    >
      <div className="flex max-w-2xl flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <GameCardSkeleton />
        <GameCardSkeleton />
      </div>
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        {placeholders.map((placeholder) => (
          <Skeleton key={placeholder} className="h-56 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
