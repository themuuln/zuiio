"use client";

import {
  Check,
  Loader2,
  Megaphone,
  RefreshCw,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { AdminOrg } from "@/lib/services/admin-service";

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  business:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  enterprise:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  trial: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const PLAN_OPTIONS = ["starter", "pro", "business", "enterprise"];

export default function AdminPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [savingOrgId, setSavingOrgId] = useState<string | null>(null);

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me");
      const json = await res.json();
      return json.data;
    },
  });

  const isSuperAdmin = meData?.isSuperAdmin === true;
  const role = meData?.role;

  const { data: orgs = [], isLoading: orgsLoading } = useQuery<AdminOrg[]>({
    queryKey: ["admin", "organizations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/organizations");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const loading = meLoading || (isSuperAdmin && orgsLoading);

  async function handlePlanChange(orgId: string, planType: string) {
    setSavingOrgId(orgId);
    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/subscription`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planType, status: "active" }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      toast.success(t("admin.updatedTo", { plan: planType }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.failedToUpdate"),
      );
    } finally {
      setSavingOrgId(null);
    }
  }

  async function handleExtendTrial(orgId: string) {
    setSavingOrgId(orgId);
    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/subscription`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extend" }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      toast.success(t("admin.trialReset"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.failedToResetTrial"),
      );
    } finally {
      setSavingOrgId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!meData?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldAlert className="size-10 text-destructive" />
        <Typography.H2 className="text-xl font-semibold">
          {t("admin.accessDenied")}
        </Typography.H2>
        <Typography.Muted className="text-muted-foreground text-center max-w-md">
          {t("admin.accessDeniedDesc")}
        </Typography.Muted>
      </div>
    );
  }

  const activeOrgs = orgs.filter(
    (o) => o.subscription?.status === "active",
  ).length;
  const trialOrgs = orgs.filter((o) => o.subscription?.trial).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="size-6" />
            {t("admin.dashboardTitle")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("admin.dashboardDesc")}
          </Typography.Muted>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {role}
          </Badge>
          {isSuperAdmin && (
            <Badge variant="outline" className="text-xs">
              {orgs.length} org{orgs.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/sellers">
          <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="size-4" />
                Seller Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.Muted className="text-xs">
                Manage sellers and organization assignments
              </Typography.Muted>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/marketing">
          <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Megaphone className="size-4" />
                Marketing Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography.Muted className="text-xs">
                Create and manage email, SMS, and push campaigns
              </Typography.Muted>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats (super admin only) */}
      {isSuperAdmin && orgs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orgs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orgs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {activeOrgs}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">On Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {trialOrgs}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t("admin.organizations")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_230px] gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>{t("admin.organization")}</span>
              <span>{t("admin.plan")}</span>
              <span>{t("admin.status")}</span>
              <span className="text-right">{t("admin.actions")}</span>
            </div>
            {orgs.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                {t("admin.noOrgs")}
              </div>
            ) : (
              orgs.map((org) => (
                <div
                  key={org.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_230px] gap-3 md:gap-4 px-6 py-4 items-center"
                >
                  <div className="min-w-0">
                    <Typography.Text className="text-sm font-medium truncate">
                      {org.name}
                    </Typography.Text>
                    <Typography.Muted className="text-xs text-muted-foreground truncate">
                      {org.slug}
                    </Typography.Muted>
                  </div>

                  <div>
                    {org.subscription ? (
                      <Badge
                        className={
                          PLAN_COLORS[org.subscription.plan_type] ?? "bg-muted"
                        }
                        variant="secondary"
                      >
                        {org.subscription.plan_type}
                        {org.subscription.trial && (
                          <span className="ml-1 text-[10px]">
                            ({t("admin.trial")})
                          </span>
                        )}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("admin.noPlan")}
                      </span>
                    )}
                  </div>

                  <div>
                    {org.subscription ? (
                      <Badge
                        className={
                          STATUS_COLORS[org.subscription.status] ?? "bg-muted"
                        }
                        variant="secondary"
                      >
                        {org.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    {PLAN_OPTIONS.map((plan) => (
                      <Button
                        key={plan}
                        size="sm"
                        variant={
                          org.subscription?.plan_type === plan
                            ? "default"
                            : "outline"
                        }
                        disabled={
                          savingOrgId === org.id ||
                          org.subscription?.plan_type === plan
                        }
                        onClick={() => handlePlanChange(org.id, plan)}
                        className="h-7 text-[11px] px-2 capitalize"
                      >
                        {savingOrgId === org.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : org.subscription?.plan_type === plan ? (
                          <Check className="size-3" />
                        ) : (
                          plan
                        )}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savingOrgId === org.id}
                      onClick={() => handleExtendTrial(org.id)}
                      className="h-7 text-[11px] px-2"
                      title={t("admin.resetTrial")}
                    >
                      {savingOrgId === org.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3" />
                      )}
                      Trial
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Typography.Muted className="text-xs text-muted-foreground">
        Changes take effect immediately. The subscription plan limits are not
        enforced yet; this only updates the plan type in the database.
      </Typography.Muted>
    </div>
  );
}
