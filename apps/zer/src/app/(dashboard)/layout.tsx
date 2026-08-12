import { Suspense } from "react";
import { DashboardFetcher } from "./dashboard-fetcher";
import { DashboardShellSkeleton } from "./dashboard-shell-skeleton";

/**
 * The dashboard is auth-gated, cookie-dependent, and fully dynamic — it can
 * never render an instant static shell, and its client components depend on
 * root-layout contexts (QueryClient, i18n, theme) that are not re-rendered
 * below the shared layout during client navigations. Opt out of Cache
 * Components instant validation so navigations into the dashboard fall back
 * to the normal blocking render instead of erroring the dev log with
 * "Could not validate `instant`".
 */
export const instant = false;

/**
 * Dashboard layout — renders a shell skeleton immediately while
 * DashboardFetcher resolves auth, profile, org, and branch data.
 *
 * Two-tier Suspense:
 * 1. Outer boundary: renders the shell skeleton while fetching auth/org data
 * 2. Inner boundary: isolates page content from shell re-renders when
 *    useSearchParams changes (branch filter, drawer state, etc.)
 *
 * The auth check + redirect happens inside the outer Suspense boundary
 * (DashboardFetcher calls getDashboardContext), which works correctly
 * because Next.js handles redirect() thrown errors even within Suspense.
 *
 * Benefit: browser receives HTML immediately (the skeleton), can start
 * fetching fonts/CSS/scripts while data queries run in parallel.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardFetcher>
        {/* Inner Suspense: isolates content searchParams from shell re-renders */}
        <Suspense fallback={null}>{children}</Suspense>
      </DashboardFetcher>
    </Suspense>
  );
}
