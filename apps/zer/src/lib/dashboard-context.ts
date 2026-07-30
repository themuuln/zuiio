import { capture } from "@zuiio/capture";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-request cached dashboard auth + profile lookup.
 *
 * Returns the same value when called from both the dashboard layout and the
 * dashboard page within the same HTTP request, eliminating duplicate
 * `createClient()`, `getClaims()`, and profile queries.
 *
 * Use `React.cache()` — the function body runs at most once per request.
 * The layout calls this first (populating the cache), and the page's call
 * returns the cached result instantly with zero Supabase queries.
 */
export const getDashboardContext = cache(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  if (error || !userId) {
    redirect("/login");
  }

  // User email from JWT claims (set by Supabase Auth)
  const userEmail = (claims?.email as string) ?? null;

  // Fetch profile with org details in one join
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `full_name, organization_id, branch_id,
       organizations!inner(
         name, brand_config, company_type, onboarding_completed, enabled_features,
         has_suppliers, has_inventory, has_customer_credit, has_multi_branch,
         has_variants, has_brands, has_categories, has_email_reports, has_audit_log,
         has_delivery_tracking, has_coupons, has_gift_cards, has_promotions
       )`,
    )
    .eq("id", userId)
    .single();

  if (profileError) {
    // Surface the real error so a missing column doesn't look like a login redirect
    capture(profileError, { context: "dashboard context: profile query" });
  }

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organization_id) {
    redirect("/organization/new");
  }

  const org = profile.organizations as unknown as {
    name: string;
    brand_config: unknown;
    company_type: string;
    onboarding_completed: boolean;
    enabled_features: string[];
    has_suppliers: boolean;
    has_inventory: boolean;
    has_customer_credit: boolean;
    has_multi_branch: boolean;
    has_variants: boolean;
    has_brands: boolean;
    has_categories: boolean;
    has_email_reports: boolean;
    has_audit_log: boolean;
    has_delivery_tracking: boolean;
    has_coupons: boolean;
    has_gift_cards: boolean;
    has_promotions: boolean;
  };

  if (!org.onboarding_completed) {
    redirect("/onboarding");
  }

  const branchId = profile.branch_id ?? null;

  return {
    supabase,
    profile,
    org,
    organizationId: profile.organization_id,
    branchId,
    isBranchScoped: branchId !== null,
    userId,
    userEmail,
  };
});
