"use client";

import { GitBranch, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useBranches } from "@/lib/queries/use-branches";
import { useCreateBranch } from "@/lib/queries/use-create-branch";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  SettingsBlock,
  SettingsError,
  SettingsGroup,
  SettingsRow,
  SettingsTableFrame,
} from "./_settings-layout";

interface BranchesSectionProps {
  orgId: string;
}

export function BranchesSection({ orgId }: BranchesSectionProps) {
  const t = useTranslations("settings");
  const { data: branches, isLoading, error } = useBranches(orgId);
  const { settings: orgSettings, isLoading: settingsLoading } =
    useOrgSettings(orgId);
  const updateOrgSettings = useUpdateOrgSettings(orgId);
  const createBranch = useCreateBranch(orgId);
  const [addBranchOpen, setAddBranchOpen] = useState(false);

  const financeSeparate =
    (orgSettings as Record<string, unknown>)?.finance_separate_per_branch ===
    true;

  const handleToggleFinanceSeparation = async (checked: boolean) => {
    try {
      // Read-then-spread merge to avoid wiping other settings
      await updateOrgSettings.mutateAsync({
        ...orgSettings,
        finance_separate_per_branch: checked,
      });
      toast.success(
        checked
          ? t("financeSeparateEnabledToast")
          : t("financeSeparateDisabledToast"),
      );
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(t("financeSeparateFailedToast"));
    }
  };

  if (isLoading || settingsLoading) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (error) {
    return <SettingsError message={error.message} />;
  }

  const safeBranches = branches ?? [];

  return (
    <SettingsBlock>
      <SettingsGroup>
        <SettingsRow
          label={t("financeSeparatePerBranch")}
          description={t("financeSeparatePerBranchDesc")}
        >
          <Switch
            checked={financeSeparate}
            onCheckedChange={handleToggleFinanceSeparation}
            disabled={updateOrgSettings.isPending}
          />
        </SettingsRow>
      </SettingsGroup>

      <div className="flex items-center justify-between">
        <Typography.Text className="text-sm font-medium">
          {t("branchList")}
        </Typography.Text>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddBranchOpen(true)}
          disabled={createBranch.isPending}
        >
          {createBranch.isPending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1.5 size-3.5" />
          )}
          {t("addBranch")}
        </Button>
      </div>

      {safeBranches.length === 0 ? (
        <Empty className="border border-dashed py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GitBranch />
            </EmptyMedia>
            <EmptyTitle>{t("noBranches")}</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>{t("noBranchesDesc")}</EmptyDescription>
        </Empty>
      ) : (
        <SettingsTableFrame>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  {t("branchName")}
                </TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  {t("branchAddress")}
                </TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  {t("branchPhone")}
                </TableHead>
                <TableHead className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                  {t("branchStatus")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeBranches.map((branch) => (
                <TableRow
                  key={branch.id}
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  <TableCell className="px-3 py-2 text-sm font-medium">
                    {branch.name}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                    {branch.address ?? "—"}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                    {branch.phone ?? "—"}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <Badge
                      variant={branch.is_active ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {branch.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SettingsTableFrame>
      )}

      {/* Add Branch Dialog */}
      <QuickCreateBranchSheet
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
        orgId={orgId}
      />
    </SettingsBlock>
  );
}
