"use client";

import OrgLogoUpload from "@/components/org-logo-upload";
import { Typography } from "@/components/ui/typography";
import type { Organization } from "@/lib/types";
import { SettingsBlock } from "./_settings-layout";

interface OrganizationCardProps {
  orgId: string;
  organization: Organization | undefined;
}

export function OrganizationCard({
  orgId,
  organization,
}: OrganizationCardProps) {
  return (
    <SettingsBlock>
      <OrgLogoUpload
        orgId={orgId}
        logoUrl={organization?.logo_url ?? null}
        orgName={organization?.name ?? "Org"}
        onLogoChange={() => {}}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-3 py-2">
          <Typography.Muted className="text-xs font-medium text-muted-foreground">
            Name
          </Typography.Muted>
          <Typography.Text className="text-sm font-medium">
            {organization?.name ?? "\u2014"}
          </Typography.Text>
        </div>
        <div className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-3 py-2">
          <Typography.Muted className="text-xs font-medium text-muted-foreground">
            Slug
          </Typography.Muted>
          <Typography.Muted className="font-mono text-sm text-muted-foreground">
            {organization?.slug ?? "\u2014"}
          </Typography.Muted>
        </div>
      </div>
    </SettingsBlock>
  );
}
