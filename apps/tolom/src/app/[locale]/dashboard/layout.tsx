// Brand theme + client shell persist across navigations — no server re-render needed.
export const instant = true;

import { generateBrandCSS } from "@zuiio/branding";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { readOrganizationBrandConfig } from "@/lib/organization-branding";
import { createClient } from "@/lib/supabase/server";
import { getCachedProfile, PrefetchDashboard } from "@/lib/queries/prefetch-dashboard";
import DashboardClientShell from "./_dashboard-client-shell";

/** Fetches org branding and emits a <style> tag. Profile fetch is
 * deduplicated with PrefetchDashboard via React.cache(). */
async function BrandThemeLoader() {
  const profile = await getCachedProfile();

  if (!profile?.organizationId) return null;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", profile.organizationId)
    .single();

  if (!org?.settings) return null;

  const config = readOrganizationBrandConfig(org.settings);
  const css = generateBrandCSS(config);
  if (!css) return null;

  return <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <BrandThemeLoader />
      </Suspense>
      <PrefetchDashboard>
        <Suspense fallback={null}>
          <DashboardClientShell>{children}</DashboardClientShell>
        </Suspense>
      </PrefetchDashboard>
    </>
  );
}
