"use client";

import { Info, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import type { Organization } from "@/lib/types";

interface DataSharingFormProps {
  organization: Organization | undefined;
  onRefetch: () => void;
}

export function DataSharingForm({
  organization,
  onRefetch,
}: DataSharingFormProps) {
  const t = useTranslations("settings");
  const [sharingEnabled, setSharingEnabled] = useState(
    organization?.sharing_enabled ?? false,
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!organization) return;

      setSaving(true);
      try {
        const res = await fetch(`/api/organizations/${organization.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sharingEnabled: checked }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(
            json.error?.message ?? "Failed to update sharing settings",
          );
        }

        setSharingEnabled(checked);
        onRefetch();
        toast.success(
          checked
            ? t("dataSharingEnabledToast")
            : t("dataSharingDisabledToast"),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("dataSharingFailedToast");
        toast.error(message);
        setSharingEnabled(!checked); // revert
      } finally {
        setSaving(false);
      }
    },
    [organization, onRefetch],
  );

  if (!organization) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Typography.Text className="font-medium">
                {t("dataSharingTitle")}
              </Typography.Text>
              <Typography.Muted className="text-sm text-muted-foreground">
                {t("dataSharingDesc")}
              </Typography.Muted>
            </div>
            <Switch
              checked={sharingEnabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
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

          <div className="flex flex-col gap-2">
            <Typography.Text className="text-sm font-medium">
              {t("accessRules")}
            </Typography.Text>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>• {t("accessRuleViewOnly")}</li>
              <li>• {t("accessRuleStaffAccess")}</li>
              <li>• {t("accessRuleDisableAnytime")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert variant="default">
        <Info className="size-4" />
        <AlertTitle>{t("aboutDataSharing")}</AlertTitle>
        <AlertDescription>{t("aboutDataSharingDesc")}</AlertDescription>
      </Alert>
    </div>
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
    <div className="flex items-start gap-2 rounded-md border p-3">
      <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <Typography.Text className="text-sm font-medium">
          {label}
        </Typography.Text>
        <Typography.Muted className="text-xs text-muted-foreground">
          {description}
        </Typography.Muted>
      </div>
    </div>
  );
}
