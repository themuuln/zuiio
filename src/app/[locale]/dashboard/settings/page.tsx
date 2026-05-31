"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Car,
  Database,
  Globe,
  MessageCircle,
  Palette,
  Percent,
  Search,
  Settings2,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { applyBrandThemePreview } from "@/components/brand-theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { usePageHeader } from "@/hooks/use-page-header";
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
import { CommissionRulesSection } from "./_commission-rules-section";
import { DataExportSection } from "./_data-export-section";
import { DataSharingForm } from "./_data-sharing-form";
import { DiagnosisLabelsSection } from "./_diagnosis-labels-section";
import { OrganizationCard } from "./_organization-card";
import { TelegramSection } from "./_telegram-section";
import { VehicleNicheForm } from "./_vehicle-niche-form";

const SETTINGS_SECTIONS = [
  {
    value: "general",
    title: "General",
    description:
      "Basic business information and default values for new invoices.",
    icon: Building2,
  },
  {
    value: "appearance",
    title: "Appearance",
    description:
      "Customize colors, theme, and interface density to match your brand.",
    icon: Palette,
  },
  {
    value: "commission",
    title: "Commission Rules",
    description: "Configure how mechanics earn commissions on work orders.",
    icon: Percent,
  },
  {
    value: "diagnosis",
    title: "Diagnosis Labels",
    description:
      "Manage reusable labels for work order complaints (e.g., engine, brake, electrical).",
    icon: Stethoscope,
  },
  {
    value: "telegram",
    title: "Telegram Bot",
    description:
      "Connect your Telegram to get service reminder summaries and revenue reports.",
    icon: MessageCircle,
  },
  {
    value: "niche",
    title: "Vehicle Niche",
    description:
      "Restrict your workshop to specific vehicle brands and models.",
    icon: Car,
  },
  {
    value: "sharing",
    title: "Data Sharing",
    description:
      "Control whether other organizations can view your customer and vehicle data.",
    icon: Globe,
  },
  {
    value: "export",
    title: "Data & Export",
    description: "Download your data or run database backups.",
    icon: Database,
  },
] as const;

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Item variant="default" className="border-0 p-0 gap-3">
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
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={`skel-${i}`} className="h-10 w-full" />
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
  message: string;
  onRetry: () => void;
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
            <Typography.Text className="font-semibold text-sm">
              Failed to load settings
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

export default function SettingsPage() {
  const { replace } = useRouter();
  const currentLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const orgInfoQuery = useCurrentOrg();
  const orgId = orgInfoQuery.data?.orgId;

  const {
    data: organization,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: orgKeys.detail(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      if (!json.data) throw new Error("No organization found");
      return json.data as Organization;
    },
    enabled: !!orgId,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (organization) {
      setForm(buildFormFromOrganization(organization));
    }
  }, [organization]);

  const preview = useCallback((color: string) => {
    applyBrandThemePreview({
      brand_color: color || undefined,
    });
  }, []);

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
        throw new Error(json.error?.message ?? "Failed to save settings");
      }

      const updated = buildFormFromOrganization(json.data);
      setForm(updated);
      refetch();
      toast.success("Settings saved");

      if (updated.language !== currentLocale) {
        setCookie("NEXT_LOCALE", updated.language, 365);
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return;
      }

      setSuccessMessage("Settings saved");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings";
      toast.error(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const { state: pageHeader, setActiveTab } = usePageHeader();
  const activeTab = pageHeader.activeTab;

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SETTINGS_SECTIONS;
    const q = searchQuery.toLowerCase();
    return SETTINGS_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Auto-select first matching section when current is hidden by search
  useEffect(() => {
    if (
      searchQuery.trim() &&
      !filteredSections.find((s) => s.value === activeTab)
    ) {
      const firstMatch = filteredSections[0]?.value;
      if (firstMatch) setActiveTab(firstMatch);
    }
  }, [filteredSections, activeTab, setActiveTab, searchQuery]);

  const activeSection =
    SETTINGS_SECTIONS.find((section) => section.value === activeTab) ??
    SETTINGS_SECTIONS[0];

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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_320px]">
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
                      Settings
                    </Typography.Text>
                    <Badge variant="secondary">{activeSection.title}</Badge>
                  </div>
                  <Typography.Muted className="max-w-2xl text-sm text-muted-foreground">
                    {activeSection.description}
                  </Typography.Muted>
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {SETTINGS_SECTIONS.length} sections
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search settings..."
                  className="h-9 pl-9 text-sm"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection.value === section.value;

                return (
                  <Button
                    key={section.value}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    className="h-auto items-start justify-start rounded-2xl border border-border/60 px-4 py-3 text-left hover:bg-muted/60"
                    onClick={() => setActiveTab(section.value)}
                  >
                    <div className="flex w-full items-start gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-background/80 ring-1 ring-border/60">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-medium leading-none">
                          {section.title}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {section.description}
                        </span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Workspace defaults
            </CardTitle>
            <CardDescription className="text-xs">
              Quick summary of the values that shape new invoices and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { label: "Organization", value: organization?.name ?? "\u2014" },
              {
                label: "Language",
                value: form.language || DEFAULT_FORM.language,
              },
              {
                label: "Timezone",
                value: form.timezone || DEFAULT_FORM.timezone,
              },
              {
                label: "Currency",
                value: form.defaultCurrency || DEFAULT_FORM.defaultCurrency,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-muted/25 px-3 py-3"
              >
                <Typography.Muted className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                  {item.label}
                </Typography.Muted>
                <Typography.Text className="mt-1 text-sm font-medium">
                  {item.value}
                </Typography.Text>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {filteredSections.length === 0 && searchQuery.trim() && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Search className="size-10 text-muted-foreground/40" />
            <Typography.Text className="text-center text-sm text-muted-foreground">
              No settings match your search
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground/70">
              Try a different keyword or browse all sections
            </Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredSections.length > 0 && activeTab === "general" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Building2}
            title="General"
            description="Basic business information and default values for new invoices."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            <OrganizationCard
              orgId={orgId ?? ""}
              organization={organization}
              onRefetch={refetch}
            />
            <BusinessDefaultsForm
              form={form}
              setForm={setForm}
              saving={saving}
              error={error}
              successMessage={successMessage}
              currentLocale={currentLocale}
              onSubmit={handleSubmit}
            />
          </div>
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "appearance" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Palette}
            title="Appearance"
            description="Customize colors, theme, and interface density to match your brand."
          />
          <div>
            <AppearanceCustomization
              form={form}
              setForm={setForm}
              theme={theme}
              setTheme={setTheme}
              preview={preview}
            />
          </div>
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "commission" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Percent}
            title="Commission Rules"
            description="Configure how mechanics earn commissions on work orders."
          />
          <CommissionRulesSection orgId={orgId ?? ""} />
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "diagnosis" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Stethoscope}
            title="Diagnosis Labels"
            description="Manage reusable labels for work order complaints (e.g., engine, brake, electrical)."
          />
          <DiagnosisLabelsSection orgId={orgId ?? ""} />
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "telegram" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={MessageCircle}
            title="Telegram Bot"
            description="Connect your Telegram to get service reminder summaries and revenue reports."
          />
          <div>
            <TelegramSection />
          </div>
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "niche" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Car}
            title="Vehicle Niche"
            description="Restrict your workshop to specific vehicle brands and models."
          />
          <div>
            <VehicleNicheForm organization={organization} onRefetch={refetch} />
          </div>
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "sharing" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Globe}
            title="Data Sharing"
            description="Control whether other organizations can view your customer and vehicle data."
          />
          <div>
            <DataSharingForm organization={organization} onRefetch={refetch} />
          </div>
        </section>
      )}

      {filteredSections.length > 0 && activeTab === "export" && (
        <section className="flex flex-col gap-4">
          <SectionHeading
            icon={Database}
            title="Data & Export"
            description="Download your data or run database backups."
          />
          <div>
            <DataExportSection orgId={orgId ?? ""} />
          </div>
        </section>
      )}
    </div>
  );
}
