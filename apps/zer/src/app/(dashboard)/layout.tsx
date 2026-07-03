import { type BranchOption, BranchProvider } from "@/lib/branch-context";
import { type BrandConfig, generateBrandCSS } from "@/lib/branding";
import { FEATURE_KEYS } from "@/lib/constants";
import { getDashboardContext } from "@/lib/dashboard-context";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile, org, organizationId } =
    await getDashboardContext();

  // Branches
  const { data: branchRows } = await supabase
    .from("branches")
    .select("id, name, slug, is_default")
    .eq("organization_id", organizationId)
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
  const hasHr = false; // has_hr column not yet added to organizations table

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
          organizationId={organizationId}
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
          }}
        >
          {children}
        </DashboardShell>
      </BranchProvider>
    </>
  );
}
