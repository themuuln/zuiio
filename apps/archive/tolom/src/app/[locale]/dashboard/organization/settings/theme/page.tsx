"use client";

import { useTranslations } from "next-intl";
import { BrandSettings } from "@/components/org-theme-settings";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export default function ThemeSettingsPage() {
  const t = (
    useTranslations as (
      ns: string,
    ) => (key: string, values?: Record<string, string | number>) => string
  )("organization.theme");
  const { data: orgInfo } = useCurrentOrg();

  if (!orgInfo) {
    return <div>{t("loading")}</div>;
  }

  return (
    <div className="flex flex-col px-4 pt-4 pb-6 md:px-6 gap-y-6">
      <div>
        <Typography.H2>{t("title")}</Typography.H2>
        <Typography.Text className="text-muted-foreground">
          Customize the look and feel of your organization&apos;s interface.
        </Typography.Text>
      </div>

      <BrandSettings orgId={orgInfo.orgId} />
    </div>
  );
}
