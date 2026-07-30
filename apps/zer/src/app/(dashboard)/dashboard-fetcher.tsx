import { withDbCapture } from "@zuiio/capture";
import { type BranchOption, BranchProvider } from "@/lib/branch-context";
import { type BrandConfig, generateBrandCSS } from "@/lib/branding";
import { FEATURE_KEYS } from "@/lib/constants";
import { getDashboardContext } from "@/lib/dashboard-context";
import { DashboardShell } from "./dashboard-shell";

/**
 * Fetches all dashboard data (profile, org, branches) and renders the
 * shell with providers. Runs inside a Suspense boundary in the layout,
 * so the auth-only check in the layout returns HTML immediately.
 */
export async function DashboardFetcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile, org, organizationId, userEmail } =
    await getDashboardContext();

  // Branches + POS checkout settings. POS settings live in newer columns and
  // are queried separately so a not-yet-migrated database degrades to the
  // column defaults instead of breaking the whole dashboard shell.
  const [{ data: branchRows }, { data: posSettings }] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, slug, is_default")
      .eq("organization_id", organizationId)
      .order("name"),
    withDbCapture(
      "dashboard_pos_settings",
      supabase
        .from("organizations")
        .select(
          "has_checkout_customer, has_checkout_quick_amounts, has_receipt_drawer, has_track_stock, shop_default_payment_method",
        )
        .eq("id", organizationId)
        .single(),
    ),
  ]);

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
  const hasHr = false;

  const _hasCheckoutCustomer = posSettings?.has_checkout_customer !== false;
  const _hasCheckoutQuickAmounts =
    posSettings?.has_checkout_quick_amounts !== false;
  const _hasReceiptDrawer = posSettings?.has_receipt_drawer !== false;
  const _hasTrackStock = posSettings?.has_track_stock !== false;
  const _shopDefaultPaymentMethod =
    posSettings?.shop_default_payment_method ?? "cash";

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
          enabledFeatures={enabledFeatures}
          organizationId={organizationId}
          organizationName={org.name ?? null}
          logoUrl={brandConfig.logo_url ?? null}
          userFullName={profile.full_name}
          userEmail={userEmail}
          hasMultiBranch={hasMultiBranch}
          orgSettings={{
            organizationId: organizationId ?? "",
            companyType: org.company_type ?? "other",
            hasSuppliers,
            hasInventory,
            hasCustomerCredit,
            hasMultiBranch,
            hasVariants,
            hasBrands,
            hasCategories,
            hasEmailReports,
            hasAuditLog,
            hasDeliveryTracking: org.has_delivery_tracking !== false,
            hasCoupons: org.has_coupons !== false,
            hasGiftCards: org.has_gift_cards !== false,
            hasPromotions: org.has_promotions !== false,
            hasCheckoutCustomer: posSettings?.has_checkout_customer !== false,
            hasCheckoutQuickAmounts:
              posSettings?.has_checkout_quick_amounts !== false,
            hasReceiptDrawer: posSettings?.has_receipt_drawer !== false,
            trackStock: posSettings?.has_track_stock !== false,
            shopDefaultPaymentMethod:
              posSettings?.shop_default_payment_method ?? "card",
          }}
        >
          {children}
        </DashboardShell>
      </BranchProvider>
    </>
  );
}
