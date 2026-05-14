"use client";

import {
  Building2,
  CalendarClock,
  CreditCard,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { orgKeys } from "@/lib/queries/keys";
import type { Organization, SubscriptionPlanInfo } from "@/lib/types";

export default function OrganizationPage() {
  const t = useTranslations();
  const orgInfoQuery = useCurrentOrg();
  const orgId = orgInfoQuery.data?.orgId;

  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
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

  const loading = orgInfoQuery.isLoading || orgLoading || subLoading;
  const error = orgInfoQuery.error?.message ?? orgError?.message ?? subError?.message ?? null;

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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
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
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav.organization")}
          </h1>
          <p className="text-muted-foreground">Manage your organization</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <p className="text-destructive">{error}</p>
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
        <h1 className="text-2xl font-bold tracking-tight">
          {t("nav.organization")}
        </h1>
        <p className="text-muted-foreground">Manage your organization</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              Organization
            </CardTitle>
            <CardDescription>Workspace details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{organization?.name ?? "\u2014"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{organization?.slug ?? "\u2014"}</p>
            </div>
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
          <CardContent className="space-y-3">
            {subscription ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">
                    {formatPlanType(subscription.planType)}
                    {subscription.trial && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Trial
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{subscription.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{formatDate(subscription.startedAt)}</p>
                </div>
                {subscription.expiresAt && (
                  <div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarClock className="size-3" />
                      Trial ends
                    </p>
                    <p className="font-medium">{formatDate(subscription.expiresAt)}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active subscription
              </p>
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
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Invite team members to collaborate.
            </p>
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
      </div>
    </div>
  );
}
