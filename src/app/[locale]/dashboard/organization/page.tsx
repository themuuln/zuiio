"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  CreditCard,
  Pencil,
  Save,
  Users,
  Palette,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization, SubscriptionPlanInfo } from "@/lib/types";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { Typography } from "@/components/ui/typography";

export default function OrganizationPage() {
  const t = useTranslations();
  const orgInfoQuery = useCurrentOrg();
  const orgId = orgInfoQuery.data?.orgId;

  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: orgKeys.detail(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as Organization;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useQuery({
    queryKey: orgKeys.subscription(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/subscription`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as SubscriptionPlanInfo;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", logoUrl: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name ?? "",
        logoUrl: organization.logo_url ?? "",
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logoUrl: form.logoUrl || null,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success("Organization updated");
      await refetchOrg();
      setEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update organization",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: organization?.name ?? "",
      logoUrl: organization?.logo_url ?? "",
    });
    setEditing(false);
  };

  const loading = orgInfoQuery.isLoading || orgLoading || subLoading;
  const error =
    orgInfoQuery.error?.message ??
    orgError?.message ??
    subError?.message ??
    null;

  const formatPlanType = (planType: string) => {
    const map: Record<string, string> = {
      starter: "Core",
      pro: "Pro",
      business: "Business",
      enterprise: "Enterprise",
    };
    return map[planType] ?? planType;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString();
  };

  const { registerTab, unregisterTab } = useRightSidebar();

  useEffect(() => {
    registerTab(
      "subscription",
      "Subscription",
      <div className="flex flex-col gap-2">
        {subscription ? (
          <>
            <div className="rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Typography.Muted className="text-[10px] text-muted-foreground">Plan</Typography.Muted>
              <Typography.Text className="text-xs font-medium">
                {formatPlanType(subscription.planType)}
              </Typography.Text>
            </div>
            <div className="rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Typography.Muted className="text-[10px] text-muted-foreground">Status</Typography.Muted>
              <Typography.Text className="text-xs font-medium capitalize">
                {subscription.status}
              </Typography.Text>
            </div>
            <div className="rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Typography.Muted className="text-[10px] text-muted-foreground">Started</Typography.Muted>
              <Typography.Text className="text-xs font-medium">
                {formatDate(subscription.startedAt)}
              </Typography.Text>
            </div>
            {subscription.trial && subscription.expiresAt && (
              <div className="rounded-md border border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 px-2.5 py-1.5">
                <Typography.Muted className="text-[10px] text-muted-foreground">Trial ends</Typography.Muted>
                <Typography.Text className="text-xs font-medium">
                  {formatDate(subscription.expiresAt)}
                </Typography.Text>
              </div>
            )}
          </>
        ) : (
          <Typography.Muted className="text-xs text-muted-foreground">
            No active subscription
          </Typography.Muted>
        )}
      </div>,
    );
    registerTab(
      "team",
      "Team",
      <Typography.Muted className="text-xs text-muted-foreground px-2.5 py-1.5">
        Manage team members via the Members page
      </Typography.Muted>,
    );
    return () => {
      unregisterTab("subscription");
      unregisterTab("team");
    };
  }, [registerTab, subscription, unregisterTab]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 size-56" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={`skeleton-${i}`}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("nav.organization")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">Manage your organization</Typography.Muted>
        </div>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <Typography.Text className="text-destructive">{error}</Typography.Text>
            <Button
              onClick={() => {
                orgInfoQuery.refetch();
              }}
              variant="outline"
            >
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("nav.organization")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">Manage your organization</Typography.Muted>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              Organization
              {!editing && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="ml-auto size-7"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
            </CardTitle>
            <CardDescription>Workspace details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {editing ? (
              <>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Name</Typography.Muted>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Organization name"
                  />
                </div>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Slug</Typography.Muted>
                  <Typography.Text className="font-medium">
                    {organization?.slug ?? "\u2014"}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Logo URL</Typography.Muted>
                  <Input
                    value={form.logoUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                    }
                    placeholder="https://example.com/logo.png"
                  />
                  {form.logoUrl && (
                    <div className="mt-2 rounded border p-1">
                      <Image
                        src={form.logoUrl}
                        alt="Logo preview"
                        width={200}
                        height={80}
                        className="max-h-20 rounded"
                        unoptimized
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    <Save className="mr-1 size-3.5" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    <X className="mr-1 size-3.5" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Name</Typography.Muted>
                  <Typography.Text className="font-medium">
                    {organization?.name ?? "\u2014"}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Slug</Typography.Muted>
                  <Typography.Text className="font-medium">
                    {organization?.slug ?? "\u2014"}
                  </Typography.Text>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              Subscription
            </CardTitle>
            <CardDescription>Current plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {subscription ? (
              <>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Plan</Typography.Muted>
                  <Typography.Text className="font-medium">
                    {formatPlanType(subscription.planType)}
                    {subscription.trial && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Trial
                      </span>
                    )}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Status</Typography.Muted>
                  <Typography.Text className="font-medium capitalize">
                    {subscription.status}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Muted className="text-sm text-muted-foreground">Started</Typography.Muted>
                  <Typography.Text className="font-medium">
                    {formatDate(subscription.startedAt)}
                  </Typography.Text>
                </div>
                {subscription.expiresAt && (
                  <div>
                    <Typography.Muted className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarClock className="size-3" />
                      Trial ends
                    </Typography.Muted>
                    <Typography.Text className="font-medium">
                      {formatDate(subscription.expiresAt)}
                    </Typography.Text>
                  </div>
                )}
              </>
            ) : (
              <Typography.Muted className="text-sm text-muted-foreground">
                No active subscription
              </Typography.Muted>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Members
            </CardTitle>
            <CardDescription>Team management</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Typography.Muted className="text-sm text-muted-foreground">
              Invite team members to collaborate.
            </Typography.Muted>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/dashboard/organization/members" />}
            >
              <Users className="mr-2 size-4" />
              Manage Members
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4" />
              Theme
            </CardTitle>
            <CardDescription>Customize appearance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Typography.Muted className="text-sm text-muted-foreground">
              Customize colors, fonts, and branding.
            </Typography.Muted>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/dashboard/organization/settings/theme" />}
            >
              <Palette className="mr-2 size-4" />
              Theme Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
