"use client";

import { CreditCard, FileText, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getBooleanSetting, getNumberSetting, getStringSetting } from "./_settings-utils";

export interface SettingsForm {
  invoicePrefix: string;
  defaultCurrency: string;
  defaultTaxRate: string;
  timezone: string;
  dateFormat: string;
  language: string;
  brandColor: string;
}

export const DEFAULT_FORM: SettingsForm = {
  invoicePrefix: "INV",
  defaultCurrency: "MNT",
  defaultTaxRate: "10",
  timezone: "Asia/Ulaanbaatar",
  dateFormat: "YYYY-MM-DD",
  language: "mn",
  brandColor: "",
};

export function buildFormFromOrganization(
  organization: { settings: unknown },
): SettingsForm {
  const settings = organization.settings as Record<string, unknown> | null;

  return {
    invoicePrefix: getStringSetting(settings, "invoice_prefix", DEFAULT_FORM.invoicePrefix),
    defaultCurrency: getStringSetting(settings, "default_currency", DEFAULT_FORM.defaultCurrency),
    language: getStringSetting(settings, "language", DEFAULT_FORM.language),
    defaultTaxRate: getNumberSetting(settings, "default_tax_rate", DEFAULT_FORM.defaultTaxRate),
    timezone: getStringSetting(settings, "timezone", DEFAULT_FORM.timezone),
    dateFormat: getStringSetting(settings, "date_format", DEFAULT_FORM.dateFormat),
    brandColor: getStringSetting(settings, "brand_color", DEFAULT_FORM.brandColor),
  };
}

const inputClassName =
  "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface BusinessDefaultsFormProps {
  form: SettingsForm;
  setForm: Dispatch<SetStateAction<SettingsForm>>;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  currentLocale: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function BusinessDefaultsForm({
  form,
  setForm,
  saving,
  error,
  successMessage,
  currentLocale,
  onSubmit,
}: BusinessDefaultsFormProps) {
  const t = useTranslations();

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold">
          Business defaults
        </CardTitle>
        <CardDescription className="text-xs">
          These settings are used for new invoices, reports, and payment flows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="invoicePrefix">Invoice prefix</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="defaultCurrency">Default currency</FieldLabel>
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
                  <option value="MNT">MNT (Mongolian Tugrik)</option>
                  <option value="CNY">CNY (Chinese Yuan)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="defaultTaxRate">Default tax rate (%)</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="dateFormat">Date format</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel htmlFor="language">Default language</FieldLabel>
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
                  <option value="mn">Монгол (Mongolian)</option>
                  <option value="en">English</option>
                </select>
              </div>
              {currentLocale !== form.language && (
                <p className="text-xs text-muted-foreground">
                  Language will change after save
                </p>
              )}
            </Field>
          </FieldGroup>

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

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              {form.language !== currentLocale
                ? "Saving will switch the interface language immediately."
                : "All changes are saved to your organization."}
            </p>
            <Button type="submit" disabled={saving} className="min-w-24">
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
