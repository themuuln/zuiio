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
  Settings2,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { applyBrandThemePreview } from "@/components/brand-theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const { state: pageHeader } = usePageHeader();
  const activeTab = pageHeader.activeTab;

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
      {activeTab === "general" && (
        <section>
          <SectionHeading
            icon={Building2}
            title="General"
            description="Basic business information and default values for new invoices."
          />
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
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

      {activeTab === "appearance" && (
        <section>
          <SectionHeading
            icon={Palette}
            title="Appearance"
            description="Customize colors, theme, and interface density to match your brand."
          />
          <div className="mt-4">
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

      {activeTab === "commission" && (
        <section>
          <SectionHeading
            icon={Percent}
            title="Commission Rules"
            description="Configure how mechanics earn commissions on work orders."
          />
          <CommissionRulesSection orgId={orgId ?? ""} />
        </section>
      )}

      {activeTab === "diagnosis" && (
        <section>
          <SectionHeading
            icon={Stethoscope}
            title="Diagnosis Labels"
            description="Manage reusable labels for work order complaints (e.g., engine, brake, electrical)."
          />
          <DiagnosisLabelsSection orgId={orgId ?? ""} />
        </section>
      )}

      {activeTab === "telegram" && (
        <section>
          <SectionHeading
            icon={MessageCircle}
            title="Telegram Bot"
            description="Connect your Telegram to get service reminder summaries and revenue reports."
          />
          <div className="mt-4">
            <TelegramSection />
          </div>
        </section>
      )}

      {activeTab === "niche" && (
        <section>
          <SectionHeading
            icon={Car}
            title="Vehicle Niche"
            description="Restrict your workshop to specific vehicle brands and models."
          />
          <div className="mt-4">
            <VehicleNicheForm organization={organization} onRefetch={refetch} />
          </div>
        </section>
      )}

      {activeTab === "sharing" && (
        <section>
          <SectionHeading
            icon={Globe}
            title="Data Sharing"
            description="Control whether other organizations can view your customer and vehicle data."
          />
          <div className="mt-4">
            <DataSharingForm organization={organization} onRefetch={refetch} />
          </div>
        </section>
      )}

      {activeTab === "export" && (
        <section>
          <SectionHeading
            icon={Database}
            title="Data & Export"
            description="Download your data or run database backups."
          />
          <div className="mt-4">
            <DataExportSection orgId={orgId ?? ""} />
          </div>
        </section>
      )}
    </div>
  );
}
