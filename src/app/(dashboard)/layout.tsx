import { redirect } from "next/navigation";
import { BranchProvider, type BranchOption } from "@/lib/branch-context";
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

  // Fetch onboarding status and enabled features from organizations table
  const { data: org } = await supabase
    .from("organizations")
    .select("onboarding_completed, enabled_features")
    .eq("id", profile.organization_id)
    .single();

  const orgRow = org as {
    onboarding_completed: boolean;
    enabled_features: string[];
  } | null;

  if (orgRow && !orgRow.onboarding_completed) {
    redirect("/onboarding");
  }

  const enabledFeatures = orgRow?.enabled_features ?? [];

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
          enabledFeatures={enabledFeatures}
        >
          {children}
        </DashboardShell>
      </BranchProvider>
    </>
  );
}
