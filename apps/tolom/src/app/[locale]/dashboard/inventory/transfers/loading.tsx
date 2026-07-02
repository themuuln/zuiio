import { Skeleton } from "@/components/ui/skeleton";

export default function TransfersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="rounded-xl border">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="flex items-center gap-4 p-4 border-b last:border-b-0"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
