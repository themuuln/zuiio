"use client";

import { useQuery } from "@tanstack/react-query";
import { generateBrandCSS, resolveBrandConfig } from "@zuiio/branding";
import { useOrgMutation } from "@zuiio/query";
import { Building2, Search, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { createOrgQuery } from "@/lib/queries/factory";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization } from "@/lib/types";
import { setCookie } from "@/lib/utils";
import { AppearanceCustomization } from "./_appearance-customization";
import { BranchesSection } from "./_branches-section";
import {
  BusinessDefaultsForm,
  buildFormFromOrganization,
  DEFAULT_FORM,
  type SettingsForm,
} from "./_business-defaults-form";
import { BusinessTypeSection } from "./_business-type-section";
import { CommissionRulesSection } from "./_commission-rules-section";
import { DataExportSection } from "./_data-export-section";
import { DataSharingForm } from "./_data-sharing-form";
import { DiagnosisLabelsSection } from "./_diagnosis-labels-section";
import { OrganizationCard } from "./_organization-card";
import { PaymentSettingsSection } from "./_payment-settings-section";
import { PricingRulesSection } from "./_pricing-rules-section";
import {
  getSettingsSections,
  type SettingsSection,
} from "./_settings-sections";
import { SettingsSubSidebar } from "./_settings-sub-sidebar";
import { TelegramSection } from "./_telegram-section";
import { VehicleNicheForm } from "./_vehicle-niche-form";

const fetchOrgDetail = createOrgQuery<Organization>("");

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
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex flex-col gap-0.5">
        <Typography.Text className="text-sm font-semibold tracking-tight">
          {title}
        </Typography.Text>
        <Typography.Muted className="text-xs text-muted-foreground">
          {description}
        </Typography.Muted>
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
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Settings2 className="size-4 text-destructive" />
        <div>
          <Typography.Text className="text-sm font-semibold">
            {t("settings.failedToLoad")}
          </Typography.Text>
          <Typography.Muted className="text-xs text-muted-foreground">
            {message}
          </Typography.Muted>
        </div>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm">
        {t("common.retry")}
      </Button>
    </div>
  );
}

function renderSectionContent(
  section: SettingsSection,
  options: {
    readonly currentLocale: string;
    readonly form: SettingsForm;
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <OrganizationCard
          orgId={options.orgId}
          organization={options.organization}
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
          (options.organization.settings as unknown as Record<string, unknown>)
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

  if (section.value === "payments") {
    return <PaymentSettingsSection orgId={options.orgId} />;
  }

  if (section.value === "diagnosis") {
    return <DiagnosisLabelsSection orgId={options.orgId} />;
  }

  if (section.value === "telegram") {
    return <TelegramSection />;
  }

  if (section.value === "niche") {
    return <VehicleNicheForm organization={options.organization} />;
  }

  if (section.value === "businessType") {
    return (
      <BusinessTypeSection
        orgId={options.orgId}
        organization={options.organization}
      />
    );
  }

  if (section.value === "sharing") {
    return <DataSharingForm organization={options.organization} />;
  }

  return <DataExportSection orgId={options.orgId} />;
}
export default function SettingsPage() {
  const { replace } = useRouter();
  const currentLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const orgSyncedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("general");
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const settingsSections = useMemo(() => getSettingsSections(t), [t]);

  const orgInfoQuery = useCurrentOrg();
  const orgId = orgInfoQuery.data?.orgId;

  const { data: organization, isPending: loading } = useQuery({
    queryKey: orgKeys.detail(orgId ?? ""),
    queryFn: () => fetchOrgDetail(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 30_000,
    retry: 1,
  });

  const updateOrg = useOrgMutation<
    Organization,
    { settings: Record<string, unknown> }
  >({
    endpoint: () => `/api/organizations/${orgId ?? ""}`,
    method: "PATCH",
    queryKey: orgKeys.detail(orgId ?? ""),
    successMessage: t("saved"),
    onSuccess: (data) => {
      const updated = buildFormFromOrganization(data);
      setForm(updated);

      if (updated.language !== currentLocale) {
        setCookie("NEXT_LOCALE", updated.language, 365);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  if (organization && !orgSyncedRef.current) {
    orgSyncedRef.current = true;
    startTransition(() => {
      setForm(buildFormFromOrganization(organization));
    });
  }

  const preview = (color: string) => {
    const css = generateBrandCSS(
      resolveBrandConfig({
        custom_colors: color ? { primary: color } : undefined,
      }),
    );
    let el = document.getElementById("brand-theme");
    if (!el) {
      el = document.createElement("style");
      el.id = "brand-theme";
      document.head.appendChild(el);
    }
    el.textContent = css;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organization) {
      setError("No organization found");
      replace("/auth/select-organization?returnUrl=/dashboard/settings");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const nextSettings = {
      ...(organization.settings as unknown as Record<string, unknown>),
      invoice_prefix: form.invoicePrefix.trim() || DEFAULT_FORM.invoicePrefix,
      default_currency:
        form.defaultCurrency.trim() || DEFAULT_FORM.defaultCurrency,
      default_tax_rate: Number(form.defaultTaxRate) || 0,
      nuat_enabled: form.nuatEnabled,
      ndsh_enabled: form.ndshEnabled,
      ndsh_employer_rate: Number(form.ndshEmployerRate) || 11.5,
      ndsh_employee_rate: Number(form.ndshEmployeeRate) || 10,
      einvoice_enabled: form.einvoiceEnabled,
      einvoice_api_key: form.einvoiceApiKey || undefined,
      einvoice_merchant_id: form.einvoiceMerchantId || undefined,
      einvoice_endpoint: form.einvoiceEndpoint || undefined,
      timezone: form.timezone.trim() || DEFAULT_FORM.timezone,
      date_format: form.dateFormat.trim() || DEFAULT_FORM.dateFormat,
      language: form.language || DEFAULT_FORM.language,
      brand_color: form.brandColor.trim() || undefined,
    };

    try {
      await updateOrg.mutateAsync({ settings: nextSettings });
      setSuccessMessage(t("saved"));
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save settings";
      setError(message);
    }
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

    for (const target of targets) {
      if (target.element) {
        observer.observe(target.element);
      }
    }
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

  if (orgInfoQuery.error && !organization) {
    return (
      <ErrorState
        message={orgInfoQuery.error.message}
        onRetry={() => orgInfoQuery.refetch()}
      />
    );
  }

  if (!organization && !loading && !orgInfoQuery.isPending) {
    return (
      <ErrorState
        message={t("noOrganization")}
        onRetry={() => orgInfoQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6 md:px-6">
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Typography.Text className="text-sm font-semibold tracking-tight">
            {t("title")}
          </Typography.Text>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {selectedSection.title}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-7 pl-8 text-xs"
            />
          </div>
          {searchQuery ? (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearchQuery("")}
            >
              <span className="sr-only">{t("clear")}</span>
              <span aria-hidden="true">&times;</span>
            </Button>
          ) : null}
          <Badge
            variant="outline"
            className="hidden shrink-0 text-[10px] sm:inline-flex"
          >
            {t("visibleSections", { count: filteredSections.length })}
          </Badge>
        </div>
      </div>

      {!organization ? (
        <div className="flex flex-col gap-4 py-4">
          <Skeleton className="h-8 w-full max-w-md" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="size-14 rounded-md" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={`settings-load-${i}`} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : filteredSections.length === 0 ? (
        <Empty className="border border-dashed py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyDescription>{t("noMatchSearch")}</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
          >
            {t("clearSearch")}
          </Button>
        </Empty>
      ) : (
        <div className="flex gap-4">
          <SettingsSubSidebar
            activeSection={selectedSection.value}
            currency={form.defaultCurrency || DEFAULT_FORM.defaultCurrency}
            language={form.language || DEFAULT_FORM.language}
            onSelect={scrollToSection}
            organizationName={organization?.name ?? ""}
            sections={filteredSections}
            timezone={form.timezone || DEFAULT_FORM.timezone}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            {/* NB: the map variable is intentionally NOT named `section` —
                shadowing the `<section>` intrinsic makes Turbopack's minifier
                emit jsxs("section_N") (an invalid custom element) instead of
                "section". */}
            {filteredSections.map((sec, index) => (
              <section
                key={sec.value}
                id={`settings-section-${sec.value}`}
                className="scroll-mt-24 flex flex-col gap-3 py-4 first:pt-0"
              >
                <SectionHeading
                  icon={sec.value === "general" ? Building2 : sec.icon}
                  title={sec.title}
                  description={sec.description}
                />
                {renderSectionContent(sec, {
                  currentLocale,
                  form,
                  onSubmit: handleSubmit,
                  orgId: orgId ?? "",
                  organization,
                  preview,
                  saving: updateOrg.isPending,
                  setForm,
                  setTheme,
                  successMessage,
                  theme,
                  error,
                })}
                {index < filteredSections.length - 1 ? (
                  <Separator className="mt-4" />
                ) : null}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
