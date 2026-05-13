"use client";

import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  MessageSquare,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
import type { ApiResponse, Organization } from "@/lib/types";
import { setCookie } from "@/lib/utils";

type SettingsForm = {
  invoicePrefix: string;
  defaultCurrency: string;
  defaultTaxRate: string;
  timezone: string;
  dateFormat: string;
  language: string;
  smsEnabled: boolean;
  qpayEnabled: boolean;
};

const DEFAULT_FORM: SettingsForm = {
  invoicePrefix: "INV",
  defaultCurrency: "MNT",
  defaultTaxRate: "10",
  timezone: "Asia/Ulaanbaatar",
  dateFormat: "YYYY-MM-DD",
  language: "mn",
  smsEnabled: false,
  qpayEnabled: false,
};

const inputClassName =
  "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function getStringSetting(
  settings: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
): string {
  const value = settings?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumberSetting(
  settings: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
): string {
  const value = settings?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
}

function getBooleanSetting(
  settings: Record<string, unknown> | null | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const value = settings?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function buildFormFromOrganization(organization: Organization): SettingsForm {
  const settings = organization.settings;

  return {
    invoicePrefix: getStringSetting(
      settings,
      "invoice_prefix",
      DEFAULT_FORM.invoicePrefix,
    ),
    defaultCurrency: getStringSetting(
      settings,
      "default_currency",
      DEFAULT_FORM.defaultCurrency,
    ),
    language: getStringSetting(settings, "language", DEFAULT_FORM.language),
    defaultTaxRate: getNumberSetting(
      settings,
      "default_tax_rate",
      DEFAULT_FORM.defaultTaxRate,
    ),
    timezone: getStringSetting(settings, "timezone", DEFAULT_FORM.timezone),
    dateFormat: getStringSetting(
      settings,
      "date_format",
      DEFAULT_FORM.dateFormat,
    ),
    smsEnabled: getBooleanSetting(
      settings,
      "sms_enabled",
      DEFAULT_FORM.smsEnabled,
    ),
    qpayEnabled: getBooleanSetting(
      settings,
      "qpay_enabled",
      DEFAULT_FORM.qpayEnabled,
    ),
  };
}

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const currentLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/organizations");
      const json = (await response.json()) as ApiResponse<Organization | null>;

      if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to load settings");
      }

      if (!json.data) {
        throw new Error("No organization found");
      }

      setOrganization(json.data);
      setForm(buildFormFromOrganization(json.data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load settings";
      setError(message);
      if (message === "No organization found") {
        router.replace(
          "/auth/select-organization?returnUrl=/dashboard/settings",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organization) {
      setError("No organization found");
      router.replace("/auth/select-organization?returnUrl=/dashboard/settings");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextSettings = {
        ...organization.settings,
        invoice_prefix: form.invoicePrefix.trim() || DEFAULT_FORM.invoicePrefix,
        default_currency:
          form.defaultCurrency.trim() || DEFAULT_FORM.defaultCurrency,
        default_tax_rate: Number(form.defaultTaxRate) || 0,
        timezone: form.timezone.trim() || DEFAULT_FORM.timezone,
        date_format: form.dateFormat.trim() || DEFAULT_FORM.dateFormat,
        language: form.language || DEFAULT_FORM.language,
        sms_enabled: form.smsEnabled,
        qpay_enabled: form.qpayEnabled,
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

      const json = (await response.json()) as ApiResponse<Organization>;

      if (!response.ok || json.error || !json.data) {
        throw new Error(json.error?.message ?? "Failed to save settings");
      }

      setOrganization(json.data);
      const updated = buildFormFromOrganization(json.data);
      setForm(updated);
      toast.success("Settings saved");

      // Switch locale if language changed
      if (updated.language !== currentLocale) {
        setCookie("NEXT_LOCALE", updated.language, 365);
        // Small delay ensures cookie is committed before reload
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav.settings")}
          </h1>
          <p className="text-muted-foreground">
            Manage your shop defaults and billing preferences.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => loadOrganization()} variant="outline">
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
          {t("nav.settings")}
        </h1>
        <p className="text-muted-foreground">
          Manage your shop defaults and billing preferences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              Organization
            </CardTitle>
            <CardDescription>Current workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{organization?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{organization?.slug ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Business defaults</CardTitle>
            <CardDescription>
              These settings are used for new invoices, reports, and payment
              flows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="invoicePrefix"
                  >
                    Invoice prefix
                  </label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invoicePrefix"
                      value={form.invoicePrefix}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          invoicePrefix: event.target.value.toUpperCase(),
                        }))
                      }
                      className="pl-9"
                      maxLength={12}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="defaultCurrency"
                  >
                    Default currency
                  </label>
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      id="defaultCurrency"
                      value={form.defaultCurrency}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          defaultCurrency: event.target.value,
                        }))
                      }
                      className={`${inputClassName} pl-9`}
                      aria-label="Default currency"
                    >
                      <option value="MNT">🇲🇳 MNT (Mongolian Tugrik)</option>
                      <option value="CNY">🇨🇳 CNY (Chinese Yuan)</option>
                      <option value="USD">🇺🇸 USD (US Dollar)</option>
                      <option value="EUR">🇪🇺 EUR (Euro)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="defaultTaxRate"
                  >
                    Default tax rate (%)
                  </label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.defaultTaxRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        defaultTaxRate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="timezone">
                    Timezone
                  </label>
                  <Input
                    id="timezone"
                    value={form.timezone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        timezone: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="dateFormat">
                    Date format
                  </label>
                  <Input
                    id="dateFormat"
                    value={form.dateFormat}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dateFormat: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="language">
                    Default language
                  </label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      id="language"
                      value={form.language}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          language: event.target.value,
                        }))
                      }
                      className={`${inputClassName} pl-9`}
                      aria-label="Default language"
                    >
                      <option value="mn">🇲🇳 Монгол (Mongolian)</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentLocale === form.language
                      ? "Language will change after save"
                      : "Select interface language"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <input
                    type="checkbox"
                    checked={form.smsEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        smsEnabled: event.target.checked,
                      }))
                    }
                    className="mt-1 size-4 rounded border-input"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <MessageSquare className="size-4" />
                      SMS notifications
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable text message reminders for customers.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <input
                    type="checkbox"
                    checked={form.qpayEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        qpayEnabled: event.target.checked,
                      }))
                    }
                    className="mt-1 size-4 rounded border-input"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <CreditCard className="size-4" />
                      QPay payments
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mark the shop as ready for QPay-based collections.
                    </p>
                  </div>
                </label>
              </div>

              {(error || successMessage) && (
                <div
                  className={
                    error
                      ? "rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                      : "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  }
                >
                  {error ?? successMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  {form.language !== currentLocale
                    ? "Saving will switch the interface language immediately."
                    : ""}
                </p>
                <Button type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="size-4" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred color theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    theme === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
