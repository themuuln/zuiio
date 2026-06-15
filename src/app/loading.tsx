import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="mt-4 h-10 w-40" />
      </div>
    </div>
  );
}
