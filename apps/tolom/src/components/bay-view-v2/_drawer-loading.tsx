"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface DrawerLoadingProps {
  loading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  onRetry: () => void;
}

export function DrawerLoading({
  loading,
  hasLoadedOnce,
  error,
  onRetry,
}: DrawerLoadingProps) {
  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (error && !loading && !hasLoadedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
        <Typography.Muted className="text-sm text-muted-foreground">
          {error}
        </Typography.Muted>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return null;
}

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
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-4 w-16 bg-muted-foreground/20 rounded mt-6" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-20 bg-muted-foreground/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
        <Typography.Muted className="text-sm text-muted-foreground">
          {error}
        </Typography.Muted>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
