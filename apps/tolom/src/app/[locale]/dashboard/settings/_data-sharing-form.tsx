"use client";

import { useOrgMutation } from "@zuiio/query";
import { Info, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { orgKeys } from "@/lib/queries/keys";
import type { Organization } from "@/lib/types";
import { SettingsBlock, SettingsGroup, SettingsRow } from "./_settings-layout";

interface DataSharingFormProps {
  organization: Organization | undefined;
}

export function DataSharingForm({ organization }: DataSharingFormProps) {
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [sharingEnabled, setSharingEnabled] = useState(
    organization?.sharing_enabled ?? false,
  );

  const toggleSharing = useOrgMutation<unknown, { enabled: boolean }>({
    endpoint: () => `/api/organizations/${organization?.id}`,
    method: "PATCH",
    queryKey: orgKeys.detail(organization?.id ?? ""),
    bodyFn: (vars) => ({ sharingEnabled: vars.enabled }),
    successMessage: (vars) =>
      vars.enabled
        ? t("dataSharingEnabledToast")
        : t("dataSharingDisabledToast"),
    errorMessage: t("dataSharingFailedToast"),
    onSuccess: (_, vars) => {
      setSharingEnabled(vars.enabled);
    },
  });

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (!organization) return;
      toggleSharing.mutate({ enabled: checked });
    },
    [organization, toggleSharing],
  );

  if (!organization) {
    return (
      <SettingsBlock>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-8 w-24" />
      </SettingsBlock>
    );
  }

  return (
    <SettingsBlock>
      <SettingsGroup>
        <SettingsRow
          label={t("dataSharingTitle")}
          description={t("dataSharingDesc")}
        >
          <Switch
            checked={sharingEnabled}
            onCheckedChange={handleToggle}
            disabled={toggleSharing.isPending}
          />
        </SettingsRow>
      </SettingsGroup>

      <div className="flex flex-col gap-2">
        <Typography.Text className="text-sm font-medium">
          {t("whatGetsShared")}
        </Typography.Text>
        <div className="grid gap-2 sm:grid-cols-2">
          <SharedItem
            label={t("sharedCustomerProfilesLabel")}
            description={t("sharedCustomerProfilesDesc")}
          />
          <SharedItem
            label={t("sharedVehicleDetailsLabel")}
            description={t("sharedVehicleDetailsDesc")}
          />
          <SharedItem
            label={t("sharedServiceHistoryLabel")}
            description={t("sharedServiceHistoryDesc")}
          />
          <SharedItem
            label={t("sharedInvoicesPaymentsLabel")}
            description={t("sharedInvoicesPaymentsDesc")}
          />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Typography.Text className="text-sm font-medium">
          {t("accessRules")}
        </Typography.Text>
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <li>• {t("accessRuleViewOnly")}</li>
          <li>• {t("accessRuleStaffAccess")}</li>
          <li>• {t("accessRuleDisableAnytime")}</li>
        </ul>
      </div>

      <Alert variant="default">
        <Info className="size-4" />
        <AlertTitle>{t("aboutDataSharing")}</AlertTitle>
        <AlertDescription>{t("aboutDataSharingDesc")}</AlertDescription>
      </Alert>
    </SettingsBlock>
  );
}

function SharedItem({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2">
      <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div>
        <Typography.Text className="text-xs font-medium">
          {label}
        </Typography.Text>
        <Typography.Muted className="text-[11px] text-muted-foreground">
          {description}
        </Typography.Muted>
      </div>
    </div>
  );
}
