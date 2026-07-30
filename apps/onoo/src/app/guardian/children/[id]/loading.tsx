import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ChildDetailLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
      aria-label="Хүүхдийн дэлгэрэнгүй ачаалж байна"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-36" />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {["c1", "c2", "c3"].map((id) => (
          <Card key={id} className="shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="flex flex-col gap-3">
          {["h1", "h2", "h3"].map((id) => (
            <Skeleton key={id} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  );
}
