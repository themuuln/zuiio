"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { applyBrandThemePreview } from "@/components/brand-theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization } from "@/lib/types";
import { setCookie } from "@/lib/utils";
import { AppearanceCustomization } from "./_appearance-customization";
import {
  BusinessDefaultsForm,
  buildFormFromOrganization,
  DEFAULT_FORM,
  type SettingsForm,
} from "./_business-defaults-form";
import { BranchesSection } from "./_branches-section";
import { CommissionRulesSection } from "./_commission-rules-section";
import { DataExportSection } from "./_data-export-section";
import { DataSharingForm } from "./_data-sharing-form";
import { DiagnosisLabelsSection } from "./_diagnosis-labels-section";
import { OrganizationCard } from "./_organization-card";
import { PricingRulesSection } from "./_pricing-rules-section";
import { SettingsNavigation } from "./_settings-navigation";
import {
  getSettingsSections,
  type SettingsSection,
} from "./_settings-sections";
import { TelegramSection } from "./_telegram-section";
import { VehicleNicheForm } from "./_vehicle-niche-form";

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  readonly description: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
}) {
  return (
    <Item variant="default" className="gap-3 border-0 p-0">
      <ItemMedia
        variant="icon"
        className="size-10 rounded-lg bg-muted [&_svg]:size-5 [&_svg]:text-muted-foreground"
      >
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-base tracking-tight">{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-3 h-4 w-32" />
              <Skeleton className="mt-6 size-16 rounded-lg" />
              <Skeleton className="mt-4 h-5 w-20" />
              <Skeleton className="mt-1 h-5 w-32" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-56" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={`skeleton-${index}`} className="h-10 w-full" />
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
              <div className="mt-6 flex justify-end">
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  const t = useTranslations();

  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
            <Settings2 className="size-5 text-destructive" />
          </div>
          <div>
            <Typography.Text className="text-sm font-semibold">
              t("failedToLoad")
            </Typography.Text>
            <Typography.Muted className="text-sm text-muted-foreground">
              {message}
            </Typography.Muted>
          </div>
        </div>
        <Button onClick={onRetry} variant="outline">
          {t("common.retry")}
        </Button>
      </CardContent>
    </Card>
  );
}

function renderSectionContent(
  section: SettingsSection,
  options: {
    readonly currentLocale: string;
    readonly form: SettingsForm;
    readonly onRefetch: () => void;
    readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    readonly orgId: string;
    readonly organization: Organization;
    readonly preview: (color: string) => void;
    readonly saving: boolean;
    readonly setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
    readonly setTheme: (theme: string) => void;
    readonly successMessage: string | null;
    readonly theme: string | undefined;
    readonly error: string | null;
  },
) {
  if (section.value === "general") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <OrganizationCard
          orgId={options.orgId}
          organization={options.organization}
          onRefetch={options.onRefetch}
        />
        <BusinessDefaultsForm
          form={options.form}
          setForm={options.setForm}
          saving={options.saving}
          error={options.error}
          successMessage={options.successMessage}
          currentLocale={options.currentLocale}
          onSubmit={options.onSubmit}
        />
      </div>
    );
  }

  if (section.value === "appearance") {
    return (
      <AppearanceCustomization
        form={options.form}
        setForm={options.setForm}
        theme={options.theme}
        setTheme={options.setTheme}
        preview={options.preview}
        savedBrandColor={
          (options.organization.settings as Record<string, unknown>)
            ?.brand_color as string | undefined
        }
      />
    );
  }

  if (section.value === "branches") {
    return <BranchesSection orgId={options.orgId} />;
  }

  if (section.value === "commission") {
    return <CommissionRulesSection orgId={options.orgId} />;
  }

  if (section.value === "pricing") {
    return <PricingRulesSection orgId={options.orgId} />;
  }

  if (section.value === "diagnosis") {
    return <DiagnosisLabelsSection orgId={options.orgId} />;
  }

  if (section.value === "telegram") {
    return <TelegramSection />;
  }

  if (section.value === "niche") {
    return (
      <VehicleNicheForm
        organization={options.organization}
        onRefetch={options.onRefetch}
      />
    );
  }

  if (section.value === "sharing") {
    return (
      <DataSharingForm
        organization={options.organization}
        onRefetch={options.onRefetch}
      />
    );
  }

  return <DataExportSection orgId={options.orgId} />;
}

export default function SettingsPage() {
  const { replace } = useRouter();
  const currentLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const orgSyncedRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("settings");
  const settingsSections = useMemo(() => getSettingsSections(t), [t]);

  const [activeSection, setActiveSection] = useState<string>(
    settingsSections[0]?.value ?? "",
  );

  const orgInfoQuery = useCurrentOrg();
  const orgId = orgInfoQuery.data?.orgId;

  const {
    data: organization,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: orgKeys.detail(orgId ?? ""),
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}`);
      const json = await response.json();
      if (json.error) throw new Error(json.error.message);
      if (!json.data) throw new Error("No organization found");
      return json.data as Organization;
    },
    enabled: !!orgId,
    staleTime: 30_000,
    retry: 1,
  });

  if (organization && !orgSyncedRef.current) {
    orgSyncedRef.current = true;
    startTransition(() => {
      setForm(buildFormFromOrganization(organization));
    });
  }

  const preview = (color: string) => {
    applyBrandThemePreview({
      brand_color: color || undefined,
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organization) {
      setError("No organization found");
      replace("/auth/select-organization?returnUrl=/dashboard/settings");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextSettings = {
        ...(organization.settings as Record<string, unknown>),
        invoice_prefix: form.invoicePrefix.trim() || DEFAULT_FORM.invoicePrefix,
        default_currency:
          form.defaultCurrency.trim() || DEFAULT_FORM.defaultCurrency,
        default_tax_rate: Number(form.defaultTaxRate) || 0,
        timezone: form.timezone.trim() || DEFAULT_FORM.timezone,
        date_format: form.dateFormat.trim() || DEFAULT_FORM.dateFormat,
        language: form.language || DEFAULT_FORM.language,
        brand_color: form.brandColor.trim() || undefined,
      };

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: nextSettings,
        }),
      });

      const json = await response.json();

      if (!response.ok || json.error || !json.data) {
        const errorMessage = json.error?.message ?? "Failed to save settings";
        toast.error(errorMessage);
        setError(errorMessage);
        return;
      }

      const updated = buildFormFromOrganization(json.data);
      setForm(updated);
      void refetch();
      toast.success(t("saved"));

      if (updated.language !== currentLocale) {
        setCookie("NEXT_LOCALE", updated.language, 365);
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return;
      }

      setSuccessMessage(t("saved"));
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save settings";
      toast.error(message);
      setError(message);
    }

    setSaving(false);
  }

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return settingsSections;

    return settingsSections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query),
    );
  }, [searchQuery, settingsSections]);

  useEffect(() => {
    if (filteredSections.length === 0) return;
    if (filteredSections.some((section) => section.value === activeSection)) {
      return;
    }
    setActiveSection(filteredSections[0].value);
  }, [activeSection, filteredSections]);

  useEffect(() => {
    if (filteredSections.length === 0) return;

    const targets = filteredSections
      .map((section) => ({
        element: document.getElementById(`settings-section-${section.value}`),
        value: section.value,
      }))
      .filter((target) => target.element !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) => right.intersectionRatio - left.intersectionRatio,
          );

        const nextId = visibleEntries[0]?.target.id;
        if (!nextId) return;

        const nextValue = nextId.replace("settings-section-", "");
        setActiveSection((current) =>
          current === nextValue ? current : nextValue,
        );
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0.15, 0.35, 0.6],
      },
    );

    targets.forEach((target) => {
      if (target.element) {
        observer.observe(target.element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [filteredSections]);

  const selectedSection =
    filteredSections.find((section) => section.value === activeSection) ??
    filteredSections[0] ??
    settingsSections[0];

  const scrollToSection = (sectionValue: string) => {
    const section = document.getElementById(`settings-section-${sectionValue}`);
    if (!section) return;

    setActiveSection(sectionValue);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (orgInfoQuery.isLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (orgInfoQuery.error && !organization) {
    return (
      <ErrorState
        message={orgInfoQuery.error.message}
        onRetry={() => orgInfoQuery.refetch()}
      />
    );
  }

  if (!organization) {
    return (
      <ErrorState
        message={t("noOrganization")}
        onRetry={() => orgInfoQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Settings2 className="size-5" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography.Text className="text-lg font-semibold tracking-tight">
                    {t("title")}
                  </Typography.Text>
                  <Badge variant="secondary">{selectedSection.title}</Badge>
                </div>
                <Typography.Muted className="max-w-2xl text-sm text-muted-foreground">
                  {selectedSection.description}
                </Typography.Muted>
              </div>
            </div>
            <Badge variant="outline" className="w-fit">
              {t("visibleSections", { count: filteredSections.length })}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-9 pl-9 text-sm"
              />
            </div>
            {searchQuery ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                {t("clear")}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Search className="size-10 text-muted-foreground/40" />
            <Typography.Text className="text-center text-sm text-muted-foreground">
              t("noMatchSearch")
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground/70">
              t("tryDifferentKeyword")
            </Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              t("clearSearch")
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <SettingsNavigation
            activeSection={selectedSection.value}
            currency={form.defaultCurrency || DEFAULT_FORM.defaultCurrency}
            language={form.language || DEFAULT_FORM.language}
            onSelect={scrollToSection}
            organizationName={organization.name}
            sections={filteredSections}
            timezone={form.timezone || DEFAULT_FORM.timezone}
          />

          <div className="flex min-w-0 flex-col gap-6">
            {filteredSections.map((section) => (
              <section
                key={section.value}
                id={`settings-section-${section.value}`}
                className="scroll-mt-28 flex flex-col gap-4"
              >
                <SectionHeading
                  icon={section.value === "general" ? Building2 : section.icon}
                  title={section.title}
                  description={section.description}
                />
                {renderSectionContent(section, {
                  currentLocale,
                  form,
                  onRefetch: () => void refetch(),
                  onSubmit: handleSubmit,
                  orgId: orgId ?? "",
                  organization,
                  preview,
                  saving,
                  setForm,
                  setTheme,
                  successMessage,
                  theme,
                  error,
                })}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
