// Dashboard shell is cached for instant navigation — data fetching is handled
// client-side by React Query hooks (useProfile, useDashboardBundle, etc.)
// with appropriate staleTime (5 min profile, 5 min dashboard, 2 min subscription).
// The BrandThemeLoader is wrapped in Suspense so org branding streams in.
export const instant = true;
export const prefetch = "allow-runtime";

import { generateBrandCSS } from "@zuiio/branding";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { readOrganizationBrandConfig } from "@/lib/organization-branding";
import { getCachedProfile } from "@/lib/queries/prefetch-dashboard";
import { createClient } from "@/lib/supabase/server";
import DashboardClientShell from "./_dashboard-client-shell";

/** Fetches org branding and emits a <style> tag. Profile fetch is
 * cached via React.cache() for deduplication within the same request. */
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
      <DashboardClientShell>{children}</DashboardClientShell>
    </>
  );
}
