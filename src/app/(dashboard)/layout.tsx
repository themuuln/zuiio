import { redirect } from "next/navigation";
import { type BranchOption, BranchProvider } from "@/lib/branch-context";
import { type BrandConfig, generateBrandCSS } from "@/lib/branding";
import { FEATURE_KEYS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const userId = claims?.sub;
  if (error || !userId) {
    redirect("/login");
  }

  // Fetch profile with org details in one join (eliminates separate org query)
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `full_name, organization_id, branch_id,
       organizations!inner(
         name, brand_config, onboarding_completed, enabled_features,
         has_suppliers, has_inventory, has_customer_credit, has_multi_branch,
         has_variants, has_brands, has_categories, has_email_reports, has_audit_log,
         has_hr
       )`,
    )
    .eq("id", userId)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organization_id) {
    redirect("/organization/new");
  }

  const org = profile.organizations as unknown as {
    name: string;
    brand_config: unknown;
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
    has_hr: boolean;
  };

  if (!org.onboarding_completed) {
    redirect("/onboarding");
  }

  // Branches fetched in parallel with profile above
  const { data: branchRows } = await supabase
    .from("branches")
    .select("id, name, slug, is_default")
    .eq("organization_id", profile.organization_id)
    .order("name");

  const branches: BranchOption[] = (branchRows ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    is_default: b.is_default,
  }));

  const enabledFeatures = org.enabled_features ?? [];
  const hasInventory = org.has_inventory !== false;
  const hasCustomerCredit = org.has_customer_credit !== false;
  const hasMultiBranch = org.has_multi_branch === true;
  const hasVariants = org.has_variants !== false;
  const hasBrands = org.has_brands !== false;
  const hasCategories = org.has_categories !== false;
  const hasEmailReports = org.has_email_reports === true;
  const hasAuditLog = org.has_audit_log !== false;
  const hasSuppliers = org.has_suppliers !== false;
  const hasHr = org.has_hr === true;

  const allFeatures =
    enabledFeatures.length > 0
      ? [
          ...enabledFeatures,
          ...(hasInventory ? ["_inventory"] : []),
          ...(hasCustomerCredit ? ["_customer_credit"] : []),
          ...(hasCategories ? ["_categories"] : []),
          ...(hasBrands ? ["_brands"] : []),
          ...(hasAuditLog ? ["_audit_log"] : []),
          ...(hasSuppliers ? ["_suppliers"] : []),
          ...(hasHr ? [FEATURE_KEYS.hr] : []),
        ]
      : [];

  const brandConfig = (org.brand_config ?? {}) as BrandConfig;
  const brandCSS = generateBrandCSS(brandConfig);

  return (
    <>
      {brandCSS && (
        <style
          id="brand-theme"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated CSS from brand config
          dangerouslySetInnerHTML={{ __html: brandCSS }}
        />
      )}
      {brandConfig.logo_url && (
        <link
          rel="apple-touch-icon"
          href={brandConfig.logo_url}
          id="dynamic-apple-touch-icon"
        />
      )}
      <BranchProvider branches={branches} userBranchId={profile.branch_id}>
        <DashboardShell
          organizationId={profile.organization_id}
          organizationName={org.name ?? null}
          logoUrl={brandConfig.logo_url ?? null}
          userFullName={profile.full_name}
          enabledFeatures={allFeatures}
          hasMultiBranch={hasMultiBranch}
          orgSettings={{
            hasSuppliers,
            hasInventory,
            hasCustomerCredit,
            hasMultiBranch,
            hasVariants,
            hasBrands,
            hasCategories,
            hasEmailReports,
            hasAuditLog,
            hasHr,
          }}
        >
          {children}
        </DashboardShell>
      </BranchProvider>
    </>
  );
}
