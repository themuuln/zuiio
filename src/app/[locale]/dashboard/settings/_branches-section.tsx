"use client";

import { GitBranch, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QuickCreateBranchSheet } from "@/components/branches/quick-create-branch-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    (orgSettings as Record<string, unknown>)?.[
      "finance_separate_per_branch"
    ] === true;

  const handleToggleFinanceSeparation = async (checked: boolean) => {
    try {
      // Read-then-spread merge to avoid wiping other settings
      await updateOrgSettings.mutateAsync({
        ...orgSettings,
        finance_separate_per_branch: checked,
      });
      toast.success(
        checked
          ? "Finance will separate per branch"
          : "Finance shows all branches",
      );
    } catch {
      toast.error("Failed to save finance separation setting");
    }
  };

  if (isLoading || settingsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="py-6">
          <Typography.Muted className="text-destructive">
            {error.message}
          </Typography.Muted>
        </CardContent>
      </Card>
    );
  }

  const safeBranches = branches ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Finance Separation Toggle */}
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex flex-col gap-1">
            <Typography.Text className="text-sm font-medium">
              {t("financeSeparatePerBranch")}
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground">
              {t("financeSeparatePerBranchDesc")}
            </Typography.Muted>
          </div>
          <Switch
            checked={financeSeparate}
            onCheckedChange={handleToggleFinanceSeparation}
            disabled={updateOrgSettings.isPending}
          />
        </CardContent>
      </Card>

      {/* Branch List + Add Button */}
      <div className="flex items-center justify-between">
        <Typography.H3 className="text-sm font-semibold">
          {t("branchList")}
        </Typography.H3>
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
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GitBranch />
                </EmptyMedia>
                <EmptyTitle>{t("noBranches")}</EmptyTitle>
              </EmptyHeader>
              <EmptyDescription>{t("noBranchesDesc")}</EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("branchName")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("branchAddress")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("branchPhone")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
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
                    <TableCell className="px-5 py-3.5 font-medium">
                      {branch.name}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-muted-foreground">
                      {branch.address ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-muted-foreground">
                      {branch.phone ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right">
                      <Badge
                        variant={branch.is_active ? "default" : "secondary"}
                      >
                        {branch.is_active ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Branch Dialog */}
      <QuickCreateBranchSheet
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
        orgId={orgId}
      />
    </div>
  );
}
