import { Skeleton } from "@/components/ui/skeleton";
import { LeaderTabsSkeleton } from "./components/leader-tabs";

export default function LeadersLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тэргүүлэгчид ачаалж байна"
      aria-busy="true"
    >
      <div className="flex max-w-2xl flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div aria-hidden="true">
        <LeaderTabsSkeleton />
      </div>
    </main>
  );
}
