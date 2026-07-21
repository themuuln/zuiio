import { cn } from "@/lib/utils/cn";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[8px] bg-secondary/20 dark:bg-dark-surface",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface dark:bg-dark-surface rounded-[16px] p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-14 h-14";
  return <Skeleton className={cn("rounded-full", dim)} />;
}
