import { redirect } from "next/navigation";
import type { BranchOption } from "@/lib/branch-context";
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
      <DashboardShell
        organizationId={profile.organization_id}
        organizationName={profile.organizations?.name ?? null}
        logoUrl={brandConfig.logo_url ?? null}
        userFullName={profile.full_name}
        branches={branches}
        userBranchId={profile.branch_id}
      >
        {children}
      </DashboardShell>
    </>
  );
}
