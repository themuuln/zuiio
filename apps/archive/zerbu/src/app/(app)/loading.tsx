import { SkeletonCard } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/20 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-secondary/20 rounded animate-pulse" />
          <div className="h-3 w-20 bg-secondary/20 rounded animate-pulse" />
        </div>
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
