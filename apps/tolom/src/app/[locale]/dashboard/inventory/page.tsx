// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

import { QueryClient, dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { getCachedProfile } from "@/lib/queries/prefetch-dashboard";
import { prefetchInventory } from "@/lib/queries/prefetch-pages";
import { InventoryPage } from "./_inventory-client";

export default async function InventoryPageWrapper() {
  const queryClient = new QueryClient();
  const supabase = await createClient();
  const profile = await getCachedProfile();

  if (profile?.organizationId) {
    await prefetchInventory(supabase, queryClient, profile.organizationId);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="px-4 pt-4 pb-6 md:px-6">
        <InventoryPage />
      </div>
    </HydrationBoundary>
  );
}
