// Brand theme + client shell persist across navigations — no server re-render needed.
export const instant = true;

import { generateBrandCSS } from "@zuiio/branding";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { readOrganizationBrandConfig } from "@/lib/organization-branding";
import { getCurrentUserProfile } from "@/lib/services/user-service";
import DashboardClientShell from "./_dashboard-client-shell";

/**
 * Async server layout that emits the organization's saved brand theme
 * as a <style> tag so the first paint never flashes the default palette.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let brandCSS: string | null = null;

  try {
    const supabase = await createClient();
    const profile = await getCurrentUserProfile(supabase);

    if (profile?.organizationId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", profile.organizationId)
        .single();

      if (org?.settings) {
        const config = readOrganizationBrandConfig(org.settings);
        const css = generateBrandCSS(config);
        if (css) brandCSS = css;
      }
    }
  } catch {
    // Query failure → render shell without override; existing auth wrapper
    // will redirect unauthenticated users. Fallback = canonical Zuiio theme.
  }

  return (
    <>
      {brandCSS ? (
        <style id="brand-theme" dangerouslySetInnerHTML={{ __html: brandCSS }} />
      ) : null}
      <DashboardClientShell>{children}</DashboardClientShell>
    </>
  );
}
