import { Button } from "@/components/ui/button";

interface DrawerSkeletonProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  onRetry: () => void;
}

export function DrawerSkeleton({
  loading,
  error,
  children,
  onRetry,
}: DrawerSkeletonProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-3 py-2">
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-4 w-20 rounded bg-foreground/5" />
            <div className="h-10 rounded bg-foreground/5" />
            <div className="h-10 rounded bg-foreground/5" />
            <div className="h-10 rounded bg-foreground/5" />
            <div className="mt-6 h-4 w-16 rounded bg-foreground/5" />
            <div className="h-10 rounded bg-foreground/5" />
            <div className="h-10 rounded bg-foreground/5" />
            <div className="h-20 rounded bg-foreground/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
