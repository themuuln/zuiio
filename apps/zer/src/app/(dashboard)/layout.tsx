import { Suspense } from "react";
import { DashboardFetcher } from "./dashboard-fetcher";
import { DashboardShellSkeleton } from "./dashboard-shell-skeleton";

/**
 * Dashboard layout — renders a shell skeleton immediately while
 * DashboardFetcher resolves auth, profile, org, and branch data.
 *
 * The auth check + redirect happens inside the Suspense boundary
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
      <DashboardFetcher>{children}</DashboardFetcher>
    </Suspense>
  );
}
