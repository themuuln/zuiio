import { SkeletonCard } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex items-center justify-center">
      <div className="max-w-sm w-full px-4 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
