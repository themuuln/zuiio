"use client";

import { CreditCard, FileText, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { getNumberSetting, getStringSetting } from "./_settings-utils";

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

export function buildFormFromOrganization(organization: {
  settings: unknown;
}): SettingsForm {
  const settings = organization.settings as Record<string, unknown> | null;

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
    brandColor: getStringSetting(
      settings,
      "brand_color",
      DEFAULT_FORM.brandColor,
    ),
  };
}

// ── Zod Schema ──────────────────────────────────────────────

const businessDefaultsSchema = z.object({
  invoicePrefix: z.string().max(12, "Prefix is too long"),
  defaultCurrency: z.string().min(1, "Currency is required"),
  defaultTaxRate: z
    .string()
    .min(1, "Tax rate is required")
    .refine((val) => {
      const num = Number(val);
      return !Number.isNaN(num) && num >= 0 && num <= 100;
    }, "Tax rate must be between 0 and 100"),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  language: z.string().min(1, "Language is required"),
  brandColor: z.string().optional(),
});

type BusinessDefaultsValues = z.infer<typeof businessDefaultsSchema>;

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
  form: formData,
  setForm,
  saving,
  error,
  successMessage,
  currentLocale,
  onSubmit,
}: BusinessDefaultsFormProps) {
  const t = useTranslations();

  const rhfForm = useForm<BusinessDefaultsValues>({
    resolver: zodResolver(businessDefaultsSchema),
    defaultValues: {
      invoicePrefix: formData.invoicePrefix,
      defaultCurrency: formData.defaultCurrency,
      defaultTaxRate: formData.defaultTaxRate,
      timezone: formData.timezone,
      dateFormat: formData.dateFormat,
      language: formData.language,
      brandColor: formData.brandColor,
    },
  });

  const formRef = useRef(formData);
  formRef.current = formData;

  // Keep parent state in sync when form values change
  useEffect(() => {
    const subscription = rhfForm.watch((values) => {
      setForm((prev) => {
        const next = {
          ...prev,
          invoicePrefix: values.invoicePrefix ?? prev.invoicePrefix,
          defaultCurrency: values.defaultCurrency ?? prev.defaultCurrency,
          defaultTaxRate: values.defaultTaxRate ?? prev.defaultTaxRate,
          timezone: values.timezone ?? prev.timezone,
          dateFormat: values.dateFormat ?? prev.dateFormat,
          language: values.language ?? prev.language,
          brandColor: values.brandColor ?? prev.brandColor,
        };
        // Only update if values actually changed to avoid infinite loops
        if (
          next.invoicePrefix === prev.invoicePrefix &&
          next.defaultCurrency === prev.defaultCurrency &&
          next.defaultTaxRate === prev.defaultTaxRate &&
          next.timezone === prev.timezone &&
          next.dateFormat === prev.dateFormat &&
          next.language === prev.language &&
          next.brandColor === prev.brandColor
        ) {
          return prev;
        }
        return next;
      });
    });
    return () => subscription.unsubscribe();
  }, [rhfForm.watch, setForm]);

  const watchedLanguage = rhfForm.watch("language");
  const watchedInvoicePrefix = rhfForm.watch("invoicePrefix");

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
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
        >
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!rhfForm.formState.errors.invoicePrefix}>
              <FieldLabel htmlFor="invoicePrefix">Invoice prefix</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invoicePrefix"
                    value={watchedInvoicePrefix}
                    onChange={(e) =>
                      rhfForm.setValue(
                        "invoicePrefix",
                        e.target.value.toUpperCase(),
                      )
                    }
                    className="pl-9"
                    maxLength={12}
                    aria-invalid={!!rhfForm.formState.errors.invoicePrefix}
                  />
                </div>
                {rhfForm.formState.errors.invoicePrefix && (
                  <FieldError>
                    {rhfForm.formState.errors.invoicePrefix.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!rhfForm.formState.errors.defaultCurrency}>
              <FieldLabel htmlFor="defaultCurrency">
                Default currency
              </FieldLabel>
              <FieldContent>
                <Select
                  value={rhfForm.watch("defaultCurrency")}
                  onValueChange={(value) =>
                    value && rhfForm.setValue("defaultCurrency", value)
                  }
                >
                  <SelectTrigger
                    id="defaultCurrency"
                    className="h-11 w-full"
                    aria-invalid={!!rhfForm.formState.errors.defaultCurrency}
                  >
                    <CreditCard className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MNT">MNT (Mongolian Tugrik)</SelectItem>
                    <SelectItem value="CNY">CNY (Chinese Yuan)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
                {rhfForm.formState.errors.defaultCurrency && (
                  <FieldError>
                    {rhfForm.formState.errors.defaultCurrency.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!rhfForm.formState.errors.defaultTaxRate}>
              <FieldLabel htmlFor="defaultTaxRate">
                Default tax rate (%)
              </FieldLabel>
              <FieldContent>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  aria-invalid={!!rhfForm.formState.errors.defaultTaxRate}
                  {...rhfForm.register("defaultTaxRate")}
                />
                {rhfForm.formState.errors.defaultTaxRate && (
                  <FieldError>
                    {rhfForm.formState.errors.defaultTaxRate.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!rhfForm.formState.errors.timezone}>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <FieldContent>
                <Input
                  id="timezone"
                  aria-invalid={!!rhfForm.formState.errors.timezone}
                  {...rhfForm.register("timezone")}
                />
                {rhfForm.formState.errors.timezone && (
                  <FieldError>
                    {rhfForm.formState.errors.timezone.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!rhfForm.formState.errors.dateFormat}>
              <FieldLabel htmlFor="dateFormat">Date format</FieldLabel>
              <FieldContent>
                <Input
                  id="dateFormat"
                  aria-invalid={!!rhfForm.formState.errors.dateFormat}
                  {...rhfForm.register("dateFormat")}
                />
                {rhfForm.formState.errors.dateFormat && (
                  <FieldError>
                    {rhfForm.formState.errors.dateFormat.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!rhfForm.formState.errors.language}>
              <FieldLabel htmlFor="language">Default language</FieldLabel>
              <FieldContent>
                <Select
                  value={rhfForm.watch("language")}
                  onValueChange={(value) =>
                    value && rhfForm.setValue("language", value)
                  }
                >
                  <SelectTrigger
                    id="language"
                    className="h-11 w-full"
                    aria-invalid={!!rhfForm.formState.errors.language}
                  >
                    <Globe className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mn">Монгол (Mongolian)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                {rhfForm.formState.errors.language && (
                  <FieldError>
                    {rhfForm.formState.errors.language.message}
                  </FieldError>
                )}
                {currentLocale !== watchedLanguage && (
                  <Typography.Muted className="text-xs text-muted-foreground">
                    Language will change after save
                  </Typography.Muted>
                )}
              </FieldContent>
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
            <Typography.Muted className="text-xs text-muted-foreground">
              {watchedLanguage !== currentLocale
                ? "Saving will switch the interface language immediately."
                : "All changes are saved to your organization."}
            </Typography.Muted>
            <Button type="submit" disabled={saving} className="min-w-24">
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
