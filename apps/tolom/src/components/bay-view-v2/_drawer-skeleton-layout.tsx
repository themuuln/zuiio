import { Skeleton } from "@/components/ui/skeleton";

/**
 * Structural skeleton matching the exact layout of DrawerContentPanel.
 * Shown during initial data load so the drawer feels instant —
 * the skeleton matches the real layout grid so the swap is seamless.
 *
 * PPR pattern: always render structure, skeleton-load values inline.
 */
export function DrawerSkeletonLayout({
  isFullScreen,
}: {
  isFullScreen?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Scrollable sections area (matches DrawerContentPanel) ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={
            isFullScreen
              ? "mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_19rem]"
              : "mx-auto w-full max-w-3xl space-y-4 px-4 py-4"
          }
        >
          {/* Left column: services, parts */}
          <div className={isFullScreen ? "space-y-4" : ""}>
            <div className="flex flex-col divide-y divide-border/40">
              {/* ── Services section skeleton ── */}
              <div className="rounded-xl bg-card/40 p-3">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-8 rounded-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <Skeleton className="mt-2 h-9 w-full rounded-lg" />
              </div>

              {/* ── Parts section skeleton ── */}
              <div className="rounded-xl bg-card/40 p-3">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-3.5 w-14" />
                  <Skeleton className="h-3.5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="mt-2 h-9 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Right column: timeline (full-screen only, matching DrawerContentPanel) */}
          {isFullScreen && (
            <div className="flex flex-col gap-3 xl:sticky xl:top-0 self-start xl:border-l xl:border-border/60 xl:pl-4">
              <div className="rounded-xl bg-card/40 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex flex-col gap-4 ml-1 border-l border-border/40 pl-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── VAT + Totals skeleton (matches DrawerContentPanel totals area) ── */}
      <div className="shrink-0 border-t border-border/70 bg-card px-4 py-3">
        <div
          className={
            isFullScreen
              ? "mx-auto flex max-w-7xl flex-col gap-3"
              : "mx-auto flex max-w-3xl flex-col gap-3"
          }
        >
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
          <div className="rounded-xl border border-border/60 px-3 py-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
