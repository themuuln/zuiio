import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton shown while the dashboard layout fetches org data and branches.
 * Matches the real DashboardShell layout to prevent layout shift on hydration.
 */
export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar skeleton */}
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
        <div className="flex h-full flex-col gap-4 p-4">
          {/* Logo area */}
          <Skeleton className="h-8 w-32" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          {/* User area */}
          <div className="flex items-center gap-3 border-t pt-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <Skeleton className="h-5 w-5" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </header>

        {/* Page content — loading.tsx will provide its own skeleton */}
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
