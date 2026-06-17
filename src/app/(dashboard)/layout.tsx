import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandConfig, generateBrandCSS } from "@/lib/branding";
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
    .select("full_name, organization_id, organizations(name, brand_config)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organization_id) {
    redirect("/organization/new");
  }

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
      >
        {children}
      </DashboardShell>
    </>
  );
}
