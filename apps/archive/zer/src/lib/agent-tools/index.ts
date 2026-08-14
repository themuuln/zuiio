import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tool } from "@zuiio/ai-agent";
import type { Database } from "@/lib/supabase/types";
import { createInventoryTools } from "./inventory";
import { createSalesTools } from "./sales";

/**
 * Create all agent tools scoped to a specific organization.
 * Must be called with a service_role Supabase client.
 */
export function createAllAgentTools(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool[] {
  return [
    ...createInventoryTools(supabase, orgId),
    ...createSalesTools(supabase, orgId),
  ];
}

export { createInventoryTools } from "./inventory";
export { createSalesTools } from "./sales";
