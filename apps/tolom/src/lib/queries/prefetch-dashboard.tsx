import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import { cache } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/services/user-service";
import { getOrganizationSubscription } from "@/lib/services/subscription-service";
import { getDashboardData } from "@/lib/services/report-service";
import { dashboardKeys, profileKeys } from "./keys";

/**
 * Cached profile fetch — React.cache() deduplicates calls within the same
 * request so BrandThemeLoader and PrefetchDashboard share one DB round-trip.
 */
export const getCachedProfile = cache(async () => {
  const supabase = await createClient();
  return getCurrentUserProfile(supabase);
});

export async function PrefetchDashboard({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = new QueryClient();
  const supabase = await createClient();
  const profile = await getCachedProfile();

  if (profile) {
    // Hydrate profile — useProfile() finds this in cache immediately
    queryClient.setQueryData(profileKeys.current(), profile);

    const orgId = profile.organizationId;
    if (orgId) {
      // Prefetch subscription and feature flags in parallel
      await Promise.all([
        (async () => {
          const subscription = await getOrganizationSubscription(supabase, orgId);
          queryClient.setQueryData(["org", orgId, "subscription"], subscription);
        })(),
        (async () => {
          const { data: features } = await supabase
            .from("feature_flags")
            .select("id, flag_key, enabled, description")
            .eq("organization_id", orgId);
          // Match the shape useAvailableFeatures expects
          queryClient.setQueryData(["org", orgId, "features"], features ?? []);
        })(),
      ]);

      // Prefetch default "month" dashboard KPIs so the main page renders
      // without a loading skeleton on first load. Falls through silently.
      try {
        const dashboardData = await getDashboardData(supabase, orgId, "month");
        queryClient.setQueryData(
          dashboardKeys.summary(orgId, "month"),
          dashboardData,
        );
      } catch {
        // Dashboard data is non-critical — user sees the sidebar immediately
        // and the client-side fetch picks up when it resolves.
      }
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
