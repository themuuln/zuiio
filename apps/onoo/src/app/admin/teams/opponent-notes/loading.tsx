import { Skeleton } from "@/components/ui/skeleton";

const CARDS = Array.from({ length: 4 }, (_, i) => ({ id: `note-card-${i}` }));

export default function OpponentNotesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((card) => (
          <div key={card.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between pb-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
