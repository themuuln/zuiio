"use client";

import {
  Building2,
  CalendarClock,
  ChevronRight,
  CreditCard,
  Palette,
  Pencil,
  Save,
  Settings,
  Shield,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { PushNotificationSettings } from "@/components/push-notification-settings";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { Organization, SubscriptionPlanInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface OrgEditValues {
  name: string;
  logoUrl?: string;
}

interface OrganizationWorkspaceProps {
  organization?: Organization;
  subscription?: SubscriptionPlanInfo;
  loading: boolean;
  subscriptionLoading: boolean;
  editing: boolean;
  saving: boolean;
  form: UseFormReturn<OrgEditValues>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  t: (key: string) => string;
  orgT: (key: string) => string;
  pageT: (key: string) => string;
}

interface WorkspaceDestination {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
}

function OrganizationMark({ organization }: { organization?: Organization }) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUrl = organization?.logo_url;
  const initial = organization?.name?.trim().charAt(0).toUpperCase() ?? "O";

  // Reset image-failed state when the logo URL changes
  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  if (organization?.logo_url && !imageFailed) {
    return (
      <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
        <Image
          src={organization.logo_url}
          alt={organization.name ?? "Organization"}
          fill
          sizes="56px"
          className="object-contain p-2"
          unoptimized
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
      {initial}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <Typography.Muted className="text-xs font-medium text-muted-foreground">
        {label}
      </Typography.Muted>
      <div className="min-w-0 text-sm font-medium">{children}</div>
    </div>
  );
}

function OrganizationIdentityPanel({
  organization,
  loading,
  editing,
  saving,
  form,
  onEdit,
  onCancel,
  onSave,
  t,
  pageT,
}: Pick<
  OrganizationWorkspaceProps,
  | "organization"
  | "loading"
  | "editing"
  | "saving"
  | "form"
  | "onEdit"
  | "onCancel"
  | "onSave"
  | "t"
  | "pageT"
>) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex-row items-start gap-4 space-y-0 border-b pb-4">
        {loading ? (
          <Skeleton className="size-14 shrink-0 rounded-md" />
        ) : (
          <OrganizationMark organization={organization} />
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-4 w-28" />
            </>
          ) : (
            <>
              <CardTitle className="truncate text-base">
                {organization?.name ?? "—"}
              </CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {organization?.slug ?? "—"}
              </CardDescription>
            </>
          )}
        </div>
        {!loading && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="size-3.5" />
            {t("common.edit")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-1">
        {loading ? (
          <div className="space-y-5 py-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : editing ? (
          <form
            className="space-y-5 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit(onSave)();
            }}
          >
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel>{pageT("nameLabel")}</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!form.formState.errors.name}
                  placeholder={pageT("orgNamePlaceholder")}
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </FieldContent>
            </Field>
            <Field data-invalid={!!form.formState.errors.logoUrl}>
              <FieldLabel>{pageT("logoUrlLabel")}</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={!!form.formState.errors.logoUrl}
                  placeholder={pageT("logoUrlPlaceholder")}
                  {...form.register("logoUrl")}
                />
                {form.formState.errors.logoUrl && (
                  <FieldError>
                    {form.formState.errors.logoUrl.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                <Save className="size-3.5" />
                {saving ? t("organization.saving") : t("common.save")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={onCancel}
              >
                <X className="size-3.5" />
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="divide-y">
            <DetailRow label={pageT("nameLabel")}>
              {organization?.name ?? "—"}
            </DetailRow>
            <DetailRow label={pageT("slugLabel")}>
              <span className="font-mono text-xs text-muted-foreground">
                {organization?.slug ?? "—"}
              </span>
            </DetailRow>
            <DetailRow label={pageT("logoUrlLabel")}>
              {organization?.logo_url ? (
                <a
                  className="block truncate text-primary underline-offset-4 hover:underline"
                  href={organization.logo_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {organization.logo_url}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailRow>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionPanel({
  subscription,
  loading,
  orgT,
  t,
}: Pick<OrganizationWorkspaceProps, "subscription" | "orgT" | "t"> & {
  loading: boolean;
}) {
  const planNames: Record<string, string> = {
    starter: orgT("planStarter"),
    pro: orgT("planPro"),
    business: orgT("planBusiness"),
    enterprise: orgT("planEnterprise"),
  };
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "—";

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-muted-foreground" />
          {orgT("subscription")}
        </CardTitle>
        <CardDescription>{orgT("currentPlanAndBilling")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {loading ? (
          <>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-32" />
          </>
        ) : subscription ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Typography.Muted className="text-xs font-medium text-muted-foreground">
                  {orgT("plan")}
                </Typography.Muted>
                <Typography.H3 className="mt-1 text-xl">
                  {planNames[subscription.planType] ?? subscription.planType}
                </Typography.H3>
              </div>
              <Badge
                variant={subscription.trial ? "outline" : "secondary"}
                className="shrink-0 capitalize"
              >
                {subscription.trial ? t("admin.trial") : subscription.status}
              </Badge>
            </div>
            <dl className="divide-y border-y">
              <DetailRow label={orgT("started")}>
                {date(subscription.startedAt)}
              </DetailRow>
              <DetailRow label={orgT("trialEnds")}>
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-muted-foreground" />
                  {date(subscription.expiresAt)}
                </span>
              </DetailRow>
            </dl>
            {subscription.planType === "enterprise" ? (
              <Badge variant="secondary">{orgT("currentPlan")}</Badge>
            ) : (
              <Link
                className={cn(buttonVariants({ size: "sm" }), "w-fit")}
                href={`/pricing?plan=${subscription.planType}`}
              >
                {orgT("upgradePlan")}
              </Link>
            )}
          </>
        ) : (
          <Typography.Muted className="text-sm">
            {orgT("noActiveSubscription")}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
}

function DestinationRow({ item }: { item: WorkspaceDestination }) {
  const Icon = item.icon;

  return (
    <Link
      className="group flex items-center gap-3 rounded-md px-3 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      href={item.href}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {item.description}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function DestinationPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Users;
  title: string;
  items: WorkspaceDestination[];
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex-row items-center gap-2 space-y-0 border-b py-3">
        <Icon className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-1">
        {items.map((item) => (
          <DestinationRow key={item.href} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

export function OrganizationWorkspace({
  organization,
  subscription,
  loading,
  subscriptionLoading,
  editing,
  saving,
  form,
  onEdit,
  onCancel,
  onSave,
  t,
  orgT,
  pageT,
}: OrganizationWorkspaceProps) {
  const people: WorkspaceDestination[] = [
    {
      href: "/dashboard/organization/members",
      icon: Users,
      title: orgT("members"),
      description: orgT("inviteTeam"),
    },
    {
      href: "/dashboard/organization/roles",
      icon: Shield,
      title: t("organization.roles.title"),
      description: orgT("manageTeamMembers"),
    },
  ];
  const operations: WorkspaceDestination[] = [
    {
      href: "/dashboard/payroll",
      icon: Settings,
      title: orgT("payroll"),
      description: orgT("setHourlyRates"),
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      title: orgT("settings"),
      description: orgT("commissionRules"),
    },
  ];
  const appearance: WorkspaceDestination[] = [
    {
      href: "/dashboard/organization/settings/theme",
      icon: Palette,
      title: orgT("theme"),
      description: orgT("customizeColors"),
    },
  ];
  const devices: WorkspaceDestination[] = [
    {
      href: "/dashboard/organization/devices",
      icon: Smartphone,
      title: orgT("devices"),
      description: orgT("registerDevices"),
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 md:px-6 md:py-6">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {orgT("organization")}
          </Typography.H1>
          <Typography.Muted className="mt-1 max-w-2xl text-sm">
            {pageT("manageYourOrg")}
          </Typography.Muted>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-40" />
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{organization?.name ?? "—"}</span>
            <span aria-hidden="true">•</span>
            <span className="font-mono">{organization?.slug ?? "—"}</span>
            {subscription && (
              <>
                <span aria-hidden="true">•</span>
                <Badge variant="secondary" className="capitalize">
                  {subscription.status}
                </Badge>
              </>
            )}
          </div>
        )}
      </header>

      <section
        className="grid gap-5 lg:grid-cols-12"
        aria-label={pageT("workspaceDetails")}
      >
        <div className="lg:col-span-7">
          <OrganizationIdentityPanel
            editing={editing}
            form={form}
            loading={loading}
            onCancel={onCancel}
            onEdit={onEdit}
            onSave={onSave}
            organization={organization}
            pageT={pageT}
            saving={saving}
            t={t}
          />
        </div>
        <div className="lg:col-span-5">
          <SubscriptionPanel
            loading={subscriptionLoading}
            orgT={orgT}
            subscription={subscription}
            t={t}
          />
        </div>
      </section>

      <section
        className="space-y-4"
        aria-labelledby="workspace-controls-heading"
      >
        <div>
          <Typography.H2 id="workspace-controls-heading" className="text-lg">
            {orgT("settings")}
          </Typography.H2>
          <Typography.Muted className="mt-1 text-sm">
            {orgT("businessDefaultsAndRules")}
          </Typography.Muted>
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <DestinationPanel
              icon={Users}
              items={people}
              title={orgT("teamManagement")}
            />
          </div>
          <div className="lg:col-span-3">
            <DestinationPanel
              icon={Palette}
              items={appearance}
              title={orgT("theme")}
            />
          </div>
          <div className="lg:col-span-3">
            <DestinationPanel
              icon={Smartphone}
              items={devices}
              title={orgT("devices")}
            />
          </div>
          <div className="lg:col-span-6">
            <DestinationPanel
              icon={Building2}
              items={operations}
              title={orgT("businessDefaultsAndRules")}
            />
          </div>
          <div className="lg:col-span-6">
            <PushNotificationSettings />
          </div>
        </div>
      </section>
    </main>
  );
}
