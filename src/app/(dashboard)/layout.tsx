import { redirect } from "next/navigation";
import { type BranchOption, BranchProvider } from "@/lib/branch-context";
import { type BrandConfig, generateBrandCSS } from "@/lib/branding";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, organization_id, branch_id, organizations(name, brand_config)",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organization_id) {
    redirect("/organization/new");
  }

  // Fetch org settings
  const { data: org } = await supabase
    .from("organizations")
    .select(
      "onboarding_completed, enabled_features, has_suppliers, has_inventory, has_customer_credit, has_multi_branch, has_variants, has_brands, has_categories, has_email_reports, has_audit_log",
    )
    .eq("id", profile.organization_id)
    .single();

  const orgRow = org as {
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
  } | null;

  if (orgRow && !orgRow.onboarding_completed) {
    redirect("/onboarding");
  }

  const enabledFeatures = orgRow?.enabled_features ?? [];
  const hasInventory = orgRow?.has_inventory !== false;
  const hasCustomerCredit = orgRow?.has_customer_credit !== false;
  const hasMultiBranch = orgRow?.has_multi_branch === true;
  const hasVariants = orgRow?.has_variants !== false;
  const hasBrands = orgRow?.has_brands !== false;
  const hasCategories = orgRow?.has_categories !== false;
  const hasEmailReports = orgRow?.has_email_reports === true;
  const hasAuditLog = orgRow?.has_audit_log !== false;
  const hasSuppliers = orgRow?.has_suppliers !== false;

  // Add synthetic feature keys only when real features are configured
  // (keeps backward compat: empty enabledFeatures = show everything)
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
        ]
      : [];

  // Fetch branches for the sidebar selector
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

  const brandConfig = (profile.organizations?.brand_config ??
    {}) as BrandConfig;
  const brandCSS = generateBrandCSS(brandConfig);

  return (
    <>
      {brandCSS && (
        <style
          id="brand-theme"
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
          organizationName={profile.organizations?.name ?? null}
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
          }}
        >
          {children}
        </DashboardShell>
      </BranchProvider>
    </>
  );
}
