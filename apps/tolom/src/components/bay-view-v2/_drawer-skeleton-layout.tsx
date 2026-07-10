import { Skeleton } from "@/components/ui/skeleton";

/**
 * Structural skeleton matching the exact layout of DrawerContentPanel.
 * Shown during initial data load so the drawer feels instant —
 * the skeleton matches the real layout grid so the swap is seamless.
 *
 * PPR pattern: always render structure, skeleton-load values inline.
 */
export function DrawerSkeletonLayout() {
  return (
    <>
      {/* ── Scrollable sections area (matches DrawerContentPanel) ── */}
      <div className="relative flex-1 overflow-y-auto min-h-0">
        <div className="relative px-3 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left column: services, parts, notes */}
            <div className="lg:col-span-2">
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

            {/* Right column: timeline */}
            <div className="flex flex-col gap-3 lg:sticky lg:top-3 self-start lg:border-l lg:border-border/40 lg:pl-4">
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
          </div>
        </div>
      </div>

      {/* ── VAT + Totals skeleton (matches DrawerContentPanel totals area) ── */}
      <div className="px-3 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-2 w-24" />
              </div>
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

      {/* NOTE: Customer bar and Footer skeletons are rendered in the parent
          work-order-detail-drawer.tsx at the correct DOM positions,
          not inside the content area. */}
      {/* ── The content area skeleton ends here; customer + footer are handled above/below ── */}
    </>
  );
}
