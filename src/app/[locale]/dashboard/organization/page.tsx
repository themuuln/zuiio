'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarClock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Palette,
  Pencil,
  Save,
  Settings,
  Shield,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { useRightSidebar } from '@/hooks/use-right-sidebar';
import { useForm, zodResolver } from '@/lib/hooks/use-form';
import { orgKeys } from '@/lib/queries/keys';
import { useCurrentOrg } from '@/lib/queries/use-organization';
import type { Organization, SubscriptionPlanInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

const orgEditSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Name is too long'),
  logoUrl: z.string().url('Invalid URL').or(z.literal('')),
});

type OrgEditValues = z.infer<typeof orgEditSchema>;

export default function OrganizationPage() {
  const t = useTranslations();
  const orgT = useTranslations('organization');
  const pageT = useTranslations('organization.page');
  const orgInfoQuery = useCurrentOrg();
  const orgId = orgInfoQuery.data?.orgId;

  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
  } = useQuery({
    queryKey: orgKeys.detail(orgId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Failed to load organization');
      }
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
    queryKey: orgKeys.subscription(orgId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/subscription`);
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Failed to load subscription');
      }
      return json.data as SubscriptionPlanInfo;
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const form = useForm<OrgEditValues>({
    resolver: zodResolver(orgEditSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
    },
  });

  const watchedLogoUrl = form.watch('logoUrl');
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!organization || editing) return;
    form.reset({
      name: organization.name ?? '',
      logoUrl: organization.logo_url ?? '',
    });
  }, [editing, form, organization]);

  const handleSave = async () => {
    if (!orgId) return;

    setIsSaving(true);
    const values = form.getValues();

    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          logoUrl: values.logoUrl || null,
        }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? orgT('failedToUpdateOrg'));
      }

      toast.success(orgT('orgUpdated'));
      await refetchOrg();
      setEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : orgT('failedToUpdateOrg'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    form.reset({
      name: organization?.name ?? '',
      logoUrl: organization?.logo_url ?? '',
    });
    setEditing(false);
  };

  const loading = orgInfoQuery.isLoading || orgLoading || subLoading;
  const error =
    orgInfoQuery.error?.message ??
    orgError?.message ??
    subError?.message ??
    null;

  const formatPlanType = useCallback(
    (planType: string) => {
      const map: Record<string, string> = {
        starter: orgT('planStarter'),
        pro: orgT('planPro'),
        business: orgT('planBusiness'),
        enterprise: orgT('planEnterprise'),
      };

      return map[planType] ?? planType;
    },
    [orgT],
  );

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString();
  }, []);

  const organizationSummary = useMemo(
    () => [
      {
        label: pageT('nameLabel'),
        value: organization?.name ?? '\u2014',
      },
      {
        label: pageT('slugLabel'),
        value: organization?.slug ?? '\u2014',
      },
      {
        label: orgT('status'),
        value: subscription?.status ?? '\u2014',
        className: 'capitalize',
      },
    ],
    [organization?.name, organization?.slug, orgT, pageT, subscription?.status],
  );

  const workspaceCards = useMemo(
    () => [
      {
        href: '/dashboard/organization/members',
        icon: Users,
        title: orgT('members'),
        description: orgT('inviteTeam'),
        actionLabel: orgT('manageMembers'),
        variant: 'default' as const,
      },
      {
        href: '/dashboard/organization/roles',
        icon: Shield,
        title: orgT('team'),
        description: orgT('manageTeamMembers'),
        actionLabel: orgT('viewRoles'),
        variant: 'outline' as const,
      },
      {
        href: '/dashboard/organization/settings/theme',
        icon: Palette,
        title: orgT('theme'),
        description: orgT('customizeColors'),
        actionLabel: orgT('themeSettings'),
        variant: 'outline' as const,
      },
      {
        href: '/dashboard/payroll',
        icon: DollarSign,
        title: orgT('payroll'),
        description: orgT('setHourlyRates'),
        actionLabel: orgT('managePayroll'),
        variant: 'outline' as const,
      },
      {
        href: '/dashboard/organization/devices',
        icon: Smartphone,
        title: orgT('devices'),
        description: orgT('registerDevices'),
        actionLabel: orgT('manageDevices'),
        variant: 'outline' as const,
      },
      {
        href: '/dashboard/settings',
        icon: Settings,
        title: orgT('settings'),
        description: orgT('commissionRules'),
        actionLabel: orgT('openSettings'),
        variant: 'outline' as const,
      },
    ],
    [orgT],
  );

  const { registerTab, unregisterTab } = useRightSidebar();

  useEffect(() => {
    registerTab(
      'subscription',
      orgT('subscription'),
      <div className="flex flex-col gap-2">
        {subscription ? (
          <>
            <div className="rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Typography.Muted className="text-[10px] text-muted-foreground">
                {orgT('plan')}
              </Typography.Muted>
              <Typography.Text className="text-xs font-medium">
                {formatPlanType(subscription.planType)}
              </Typography.Text>
            </div>
            <div className="rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Typography.Muted className="text-[10px] text-muted-foreground">
                {orgT('status')}
              </Typography.Muted>
              <Typography.Text className="text-xs font-medium capitalize">
                {subscription.status}
              </Typography.Text>
            </div>
            <div className="rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Typography.Muted className="text-[10px] text-muted-foreground">
                {orgT('started')}
              </Typography.Muted>
              <Typography.Text className="text-xs font-medium">
                {formatDate(subscription.startedAt)}
              </Typography.Text>
            </div>
            {subscription.trial && subscription.expiresAt && (
              <div className="rounded-md border border-amber-200/50 bg-amber-50/50 px-2.5 py-1.5 dark:border-amber-900/30 dark:bg-amber-950/20">
                <Typography.Muted className="text-[10px] text-muted-foreground">
                  {orgT('trialEnds')}
                </Typography.Muted>
                <Typography.Text className="text-xs font-medium">
                  {formatDate(subscription.expiresAt)}
                </Typography.Text>
              </div>
            )}
            {subscription.planType !== 'enterprise' && (
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'mt-1 h-8 w-full text-xs',
                )}
              >
                {orgT('upgradePlan')}
              </Link>
            )}
            {subscription.planType === 'enterprise' && (
              <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                {orgT('currentPlan')}
              </Badge>
            )}
          </>
        ) : (
          <Typography.Muted className="text-xs text-muted-foreground">
            {orgT('noActiveSubscription')}
          </Typography.Muted>
        )}
      </div>,
    );

    registerTab(
      'team',
      orgT('team'),
      <Typography.Muted className="px-2.5 py-1.5 text-xs text-muted-foreground">
        {orgT('manageTeamMembers')}
      </Typography.Muted>,
    );

    return () => {
      unregisterTab('subscription');
      unregisterTab('team');
    };
  }, [
    formatDate,
    formatPlanType,
    orgT,
    registerTab,
    subscription,
    unregisterTab,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-3 h-8 w-48" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={`summary-${i}`} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {[1, 2].map((i) => (
            <Card key={`card-${i}`}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 rounded-2xl" />
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
            {t('nav.organization')}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {pageT('manageYourOrg')}
          </Typography.Muted>
        </div>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <Typography.Text className="text-destructive">
              {error}
            </Typography.Text>
            <Button
              onClick={() => {
                orgInfoQuery.refetch();
              }}
              variant="outline"
            >
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-2.5 py-0.5">
              <Building2 className="mr-1 size-3.5" />
              {orgT('organization')}
            </Badge>
            <div>
              <Typography.H1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t('nav.organization')}
              </Typography.H1>
              <Typography.Muted className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {pageT('manageYourOrg')}
              </Typography.Muted>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {organizationSummary.map((item) => (
              <div
                key={item.label}
                className="min-w-[132px] rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
              >
                <Typography.Muted className="text-xs text-muted-foreground">
                  {item.label}
                </Typography.Muted>
                <Typography.Text
                  className={cn(
                    'mt-1 block truncate text-sm font-semibold',
                    item.className,
                  )}
                >
                  {item.value}
                </Typography.Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="gap-2 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              {orgT('organization')}
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
            <CardDescription>{orgT('workspaceDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit(handleSave)();
                }}
                className="flex flex-col gap-4"
              >
                <Field data-invalid={!!form.formState.errors.name}>
                  <FieldLabel>{pageT('nameLabel')}</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder={pageT('orgNamePlaceholder')}
                      aria-invalid={!!form.formState.errors.name}
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <FieldError>{form.formState.errors.name.message}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <Typography.Muted className="text-xs text-muted-foreground">
                      {pageT('slugLabel')}
                    </Typography.Muted>
                    <Typography.Text className="mt-1 font-medium">
                      {organization?.slug ?? '\u2014'}
                    </Typography.Text>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <Typography.Muted className="text-xs text-muted-foreground">
                      {orgT('plan')}
                    </Typography.Muted>
                    <Typography.Text className="mt-1 font-medium">
                      {subscription ? formatPlanType(subscription.planType) : '\u2014'}
                    </Typography.Text>
                  </div>
                </div>

                <Field data-invalid={!!form.formState.errors.logoUrl}>
                  <FieldLabel>{pageT('logoUrlLabel')}</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder={pageT('logoUrlPlaceholder')}
                      aria-invalid={!!form.formState.errors.logoUrl}
                      {...form.register('logoUrl')}
                    />
                    {form.formState.errors.logoUrl && (
                      <FieldError>
                        {form.formState.errors.logoUrl.message}
                      </FieldError>
                    )}
                    {watchedLogoUrl && (
                      <div className="mt-3 rounded-2xl border border-border/60 bg-muted/20 p-2">
                        <Image
                          src={watchedLogoUrl}
                          alt={orgT('logoPreview')}
                          width={200}
                          height={80}
                          className="max-h-20 rounded-lg"
                          unoptimized
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      </div>
                    )}
                  </FieldContent>
                </Field>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSaving} size="sm">
                    <Save className="mr-1 size-3.5" />
                    {isSaving ? orgT('saving') : orgT('saved')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    <X className="mr-1 size-3.5" />
                    {orgT('cancel')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {pageT('nameLabel')}
                  </Typography.Muted>
                  <Typography.Text className="mt-1 text-sm font-semibold">
                    {organization?.name ?? '\u2014'}
                  </Typography.Text>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {pageT('slugLabel')}
                  </Typography.Muted>
                  <Typography.Text className="mt-1 text-sm font-semibold">
                    {organization?.slug ?? '\u2014'}
                  </Typography.Text>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {pageT('logoUrlLabel')}
                  </Typography.Muted>
                  <Typography.Text className="mt-1 truncate text-sm font-semibold">
                    {organization?.logo_url ?? '\u2014'}
                  </Typography.Text>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {orgT('subscription')}
                  </Typography.Muted>
                  <Typography.Text className="mt-1 text-sm font-semibold">
                    {subscription ? formatPlanType(subscription.planType) : '\u2014'}
                  </Typography.Text>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="gap-2 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              {orgT('subscription')}
            </CardTitle>
            <CardDescription>{orgT('currentPlanAndBilling')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {subscription ? (
              <>
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                  <div>
                    <Typography.Muted className="text-xs text-muted-foreground">
                      {orgT('plan')}
                    </Typography.Muted>
                    <Typography.Text className="mt-1 font-semibold">
                      {formatPlanType(subscription.planType)}
                    </Typography.Text>
                  </div>
                  {subscription.trial ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
                    >
                      {t('admin.trial')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 capitalize">
                      {subscription.status}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <Typography.Muted className="text-xs text-muted-foreground">
                      {orgT('started')}
                    </Typography.Muted>
                    <Typography.Text className="mt-1 font-medium">
                      {formatDate(subscription.startedAt)}
                    </Typography.Text>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <Typography.Muted className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" />
                      {orgT('trialEnds')}
                    </Typography.Muted>
                    <Typography.Text className="mt-1 font-medium">
                      {formatDate(subscription.expiresAt)}
                    </Typography.Text>
                  </div>
                </div>

                {subscription.planType !== 'enterprise' ? (
                  <Link
                    href={`/pricing?plan=${subscription.planType}`}
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'h-9 rounded-xl',
                    )}
                  >
                    {orgT('upgradePlan')}
                  </Link>
                ) : (
                  <Badge variant="secondary" className="w-fit rounded-full px-2.5 py-0.5">
                    {orgT('currentPlan')}
                  </Badge>
                )}
              </>
            ) : (
              <Typography.Muted className="text-sm text-muted-foreground">
                {orgT('noActiveSubscription')}
              </Typography.Muted>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaceCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="border-border/60 shadow-sm">
              <CardHeader className="gap-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: item.variant }),
                    'h-10 w-full justify-between rounded-xl',
                  )}
                >
                  <span>{item.actionLabel}</span>
                  <ExternalLink className="size-4" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
