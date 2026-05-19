import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-4 w-32" />
            <Skeleton className="mt-6 size-16 rounded-lg" />
            <Skeleton className="mt-4 h-5 w-20" />
            <Skeleton className="mt-1 h-5 w-32" />
            <Skeleton className="mt-3 h-5 w-16" />
            <Skeleton className="mt-1 h-5 w-36" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-48" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={`skel-${i}`} className="h-11 w-full" />
              ))}
            </div>
            <Skeleton className="mt-6 h-16 w-full rounded-lg" />
            <Skeleton className="mt-6 h-16 w-full rounded-lg" />
            <div className="mt-6 flex justify-between">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-48" />
          <Skeleton className="mt-4 h-10 w-72 rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-56" />
          <Skeleton className="mt-4 h-10 w-48 rounded-xl" />
          <Skeleton className="mt-6 h-10 w-52 rounded-xl" />
          <Skeleton className="mt-6 h-10 w-52 rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
