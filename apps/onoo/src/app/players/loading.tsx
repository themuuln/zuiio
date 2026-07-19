import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayersLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Тоглогчид ачаалж байна"
      aria-busy="true"
    >
      <header className="max-w-2xl">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-10 w-48" />
        <Skeleton className="mt-3 h-5 w-80" />
      </header>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["p1", "p2", "p3", "p4", "p5", "p6"].map((id) => (
          <Card key={id} className="shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
