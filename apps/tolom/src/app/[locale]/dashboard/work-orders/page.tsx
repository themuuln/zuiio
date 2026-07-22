// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { getCachedProfile } from "@/lib/queries/prefetch-dashboard";
import { prefetchWorkOrders } from "@/lib/queries/prefetch-pages";
import { WorkOrdersPage } from "./_work-orders-client";

export default async function WorkOrdersPageWrapper() {
  const queryClient = new QueryClient();
  const supabase = await createClient();
  const profile = await getCachedProfile();

  if (profile?.organizationId) {
    await prefetchWorkOrders(supabase, queryClient, profile.organizationId);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="px-4 pt-4 pb-6 md:px-6">
        <WorkOrdersPage />
      </div>
    </HydrationBoundary>
  );
}
