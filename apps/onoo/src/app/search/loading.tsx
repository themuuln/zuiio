import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Хайлт ачаалж байна"
      aria-busy="true"
    >
      <header className="max-w-2xl">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-10 w-48" />
      </header>

      <Skeleton className="h-12 w-full max-w-md" />

      <div className="flex gap-2">
        {["t1", "t2", "t3", "t4"].map((id) => (
          <Skeleton key={id} className="h-9 w-24" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["r1", "r2", "r3", "r4", "r5", "r6"].map((id) => (
          <Card key={id} className="shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
