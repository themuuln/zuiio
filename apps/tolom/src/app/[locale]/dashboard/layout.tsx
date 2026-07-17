// Brand theme + client shell persist across navigations — no server re-render needed.
export const instant = true;

import { generateBrandCSS } from "@zuiio/branding";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { readOrganizationBrandConfig } from "@/lib/organization-branding";
import { getCurrentUserProfile } from "@/lib/services/user-service";
import { createClient } from "@/lib/supabase/server";
import DashboardClientShell from "./_dashboard-client-shell";

/**
 * Fetches org branding via cookies() and emits a <style> tag.
 * Isolated in its own async component so the layout shell stays static
 * for instant navigation — cookies() streams in behind a Suspense boundary.
 */
async function BrandThemeLoader() {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile(supabase);

  if (!profile?.organizationId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", profile.organizationId)
    .single();

  if (!org?.settings) return null;

  const config = readOrganizationBrandConfig(org.settings);
  const css = generateBrandCSS(config);
  if (!css) return null;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Brand theme CSS from org settings
  return <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <BrandThemeLoader />
      </Suspense>
      <Suspense fallback={null}>
        <DashboardClientShell>{children}</DashboardClientShell>
      </Suspense>
    </>
  );
}
