"use client";

import { OrgThemeSettings } from "@/components/org-theme-settings";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export default function ThemeSettingsPage() {
  const { data: orgInfo } = useCurrentOrg();

  if (!orgInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Typography.H2>Theme Customization</Typography.H2>
        <Typography.Text className="text-muted-foreground">
          Customize the look and feel of your organization&apos;s interface.
        </Typography.Text>
      </div>

      <OrgThemeSettings />
    </div>
  );
}
