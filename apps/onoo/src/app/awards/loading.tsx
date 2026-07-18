import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AwardsLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Нэрэмжүүд ачаалж байна"
      aria-busy="true"
    >
      <header className="max-w-2xl">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-10 w-48" />
        <Skeleton className="mt-3 h-5 w-80" />
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {["a1", "a2", "a3", "a4"].map((id) => (
          <Card key={id} className="shadow-none">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
