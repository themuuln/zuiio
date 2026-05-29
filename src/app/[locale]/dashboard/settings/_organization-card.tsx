"use client";

import { Building2 } from "lucide-react";
import OrgLogoUpload from "@/components/org-logo-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Organization } from "@/lib/types";
import { Typography } from "@/components/ui/typography";

interface OrganizationCardProps {
  orgId: string;
  organization: Organization | undefined;
  onRefetch: () => void;
}

export function OrganizationCard({
  orgId,
  organization,
  onRefetch,
}: OrganizationCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-0.5 bg-primary/40" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="size-3.5 text-primary" />
          </div>
          Organization
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <OrgLogoUpload
          orgId={orgId}
          logoUrl={organization?.logo_url ?? null}
          orgName={organization?.name ?? "Org"}
          onLogoChange={() => onRefetch()}
        />
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <Typography.Muted className="text-xs font-medium text-muted-foreground">
            Name
          </Typography.Muted>
          <Typography.Text className="mt-0.5 text-sm font-medium">
            {organization?.name ?? "\u2014"}
          </Typography.Text>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <Typography.Muted className="text-xs font-medium text-muted-foreground">
            Slug
          </Typography.Muted>
          <Typography.Muted className="mt-0.5 text-sm font-mono text-muted-foreground">
            {organization?.slug ?? "\u2014"}
          </Typography.Muted>
        </div>
      </CardContent>
    </Card>
  );
}
