import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="size-14 rounded-md" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`skel-${i}`} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
