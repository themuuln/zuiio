"use client";

import { CreditCard, FileText, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { SettingsBlock, SettingsGroup, SettingsRow } from "./_settings-layout";
import { getNumberSetting, getStringSetting } from "./_settings-utils";

export interface SettingsForm {
  invoicePrefix: string;
  defaultCurrency: string;
  defaultTaxRate: string;
  nuatEnabled: boolean;
  ndshEnabled: boolean;
  ndshEmployerRate: string;
  ndshEmployeeRate: string;
  einvoiceEnabled: boolean;
  einvoiceApiKey: string;
  einvoiceMerchantId: string;
  einvoiceEndpoint: string;
  timezone: string;
  dateFormat: string;
  language: string;
  brandColor: string;
}

export const DEFAULT_FORM: SettingsForm = {
  invoicePrefix: "INV",
  defaultCurrency: "MNT",
  defaultTaxRate: "10",
  nuatEnabled: false,
  ndshEnabled: false,
  ndshEmployerRate: "10",
  ndshEmployeeRate: "10",
  einvoiceEnabled: false,
  einvoiceApiKey: "",
  einvoiceMerchantId: "",
  einvoiceEndpoint: "",
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
    nuatEnabled:
      (settings?.nuat_enabled as boolean) ?? DEFAULT_FORM.nuatEnabled,
    ndshEnabled:
      (settings?.ndsh_enabled as boolean) ?? DEFAULT_FORM.ndshEnabled,
    ndshEmployerRate: getNumberSetting(
      settings,
      "ndsh_employer_rate",
      DEFAULT_FORM.ndshEmployerRate,
    ),
    ndshEmployeeRate: getNumberSetting(
      settings,
      "ndsh_employee_rate",
      DEFAULT_FORM.ndshEmployeeRate,
    ),
    einvoiceEnabled:
      (settings?.einvoice_enabled as boolean) ?? DEFAULT_FORM.einvoiceEnabled,
    einvoiceApiKey: getStringSetting(
      settings,
      "einvoice_api_key",
      DEFAULT_FORM.einvoiceApiKey,
    ),
    einvoiceMerchantId: getStringSetting(
      settings,
      "einvoice_merchant_id",
      DEFAULT_FORM.einvoiceMerchantId,
    ),
    einvoiceEndpoint: getStringSetting(
      settings,
      "einvoice_endpoint",
      DEFAULT_FORM.einvoiceEndpoint,
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
  nuatEnabled: z.boolean(),
  ndshEnabled: z.boolean(),
  ndshEmployerRate: z.string().optional(),
  ndshEmployeeRate: z.string().optional(),
  einvoiceEnabled: z.boolean(),
  einvoiceApiKey: z.string().optional(),
  einvoiceMerchantId: z.string().optional(),
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
  const t = useTranslations("settings");

  const rhfForm = useForm<BusinessDefaultsValues>({
    resolver: zodResolver(businessDefaultsSchema),
    defaultValues: {
      invoicePrefix: formData.invoicePrefix,
      defaultCurrency: formData.defaultCurrency,
      defaultTaxRate: formData.defaultTaxRate,
      nuatEnabled: formData.nuatEnabled,
      ndshEnabled: formData.ndshEnabled,
      ndshEmployerRate: formData.ndshEmployerRate,
      ndshEmployeeRate: formData.ndshEmployeeRate,
      einvoiceEnabled: formData.einvoiceEnabled,
      einvoiceApiKey: formData.einvoiceApiKey,
      einvoiceMerchantId: formData.einvoiceMerchantId,
      timezone: formData.timezone,
      dateFormat: formData.dateFormat,
      language: formData.language,
      brandColor: formData.brandColor,
    },
  });

  // Sync RHF values to parent state so sidebar/other sections stay in sync
  useEffect(() => {
    const subscription = rhfForm.watch((values) => {
      setForm((prev) => {
        const next = {
          ...prev,
          invoicePrefix: values.invoicePrefix ?? prev.invoicePrefix,
          defaultCurrency: values.defaultCurrency ?? prev.defaultCurrency,
          defaultTaxRate: values.defaultTaxRate ?? prev.defaultTaxRate,
          nuatEnabled: values.nuatEnabled ?? prev.nuatEnabled,
          ndshEnabled: values.ndshEnabled ?? prev.ndshEnabled,
          ndshEmployerRate: values.ndshEmployerRate ?? prev.ndshEmployerRate,
          ndshEmployeeRate: values.ndshEmployeeRate ?? prev.ndshEmployeeRate,
          einvoiceEnabled: values.einvoiceEnabled ?? prev.einvoiceEnabled,
          einvoiceApiKey: values.einvoiceApiKey ?? prev.einvoiceApiKey,
          einvoiceMerchantId:
            values.einvoiceMerchantId ?? prev.einvoiceMerchantId,
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
          next.nuatEnabled === prev.nuatEnabled &&
          next.ndshEnabled === prev.ndshEnabled &&
          next.ndshEmployerRate === prev.ndshEmployerRate &&
          next.ndshEmployeeRate === prev.ndshEmployeeRate &&
          next.einvoiceEnabled === prev.einvoiceEnabled &&
          next.einvoiceApiKey === prev.einvoiceApiKey &&
          next.einvoiceMerchantId === prev.einvoiceMerchantId &&
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
  const watchedNuatEnabled = rhfForm.watch("nuatEnabled");
  const watchedNdshEnabled = rhfForm.watch("ndshEnabled");
  const watchedEinvoiceEnabled = rhfForm.watch("einvoiceEnabled");

  return (
    <SettingsBlock className="lg:col-span-2">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          rhfForm.handleSubmit(() => {
            onSubmit(e);
          })();
        }}
      >
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!rhfForm.formState.errors.invoicePrefix}>
            <FieldLabel htmlFor="invoicePrefix">
              {t("invoicePrefix")}
            </FieldLabel>
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
              {t("defaultCurrency")}
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
                  className="h-9 w-full"
                  aria-invalid={!!rhfForm.formState.errors.defaultCurrency}
                >
                  <CreditCard className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={t("selectCurrency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MNT">{t("currencyMnt")}</SelectItem>
                  <SelectItem value="CNY">{t("currencyCny")}</SelectItem>
                  <SelectItem value="USD">{t("currencyUsd")}</SelectItem>
                  <SelectItem value="EUR">{t("currencyEur")}</SelectItem>
                </SelectContent>
              </Select>
              {rhfForm.formState.errors.defaultCurrency && (
                <FieldError>
                  {rhfForm.formState.errors.defaultCurrency.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          <Field className="sm:col-span-2">
            <FieldContent>
              <SettingsGroup>
                <SettingsRow
                  label={currentLocale === "mn" ? "НӨАТ татвар" : "VAT"}
                  description={
                    currentLocale === "mn"
                      ? "Нэмэгдсэн Өртөгт Татвар (10%)"
                      : "Value Added Tax (10%)"
                  }
                >
                  <Switch
                    id="nuatEnabled"
                    checked={watchedNuatEnabled}
                    onCheckedChange={(checked) =>
                      rhfForm.setValue("nuatEnabled", checked)
                    }
                  />
                </SettingsRow>
              </SettingsGroup>
            </FieldContent>
          </Field>

          {/* НӨАТ Rate - only shown when enabled */}
          {watchedNuatEnabled && (
            <Field data-invalid={!!rhfForm.formState.errors.defaultTaxRate}>
              <FieldLabel htmlFor="defaultTaxRate">
                {currentLocale === "mn" ? "НӨАТ хувь" : "VAT Rate"}
              </FieldLabel>
              <FieldContent>
                <div className="flex items-center gap-2">
                  <NumericInput
                    id="defaultTaxRate"
                    value={Number(rhfForm.watch("defaultTaxRate")) || 0}
                    onChange={(val) =>
                      rhfForm.setValue("defaultTaxRate", String(val))
                    }
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-24"
                    aria-invalid={!!rhfForm.formState.errors.defaultTaxRate}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                {rhfForm.formState.errors.defaultTaxRate && (
                  <FieldError>
                    {rhfForm.formState.errors.defaultTaxRate.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>
          )}

          <Field className="sm:col-span-2">
            <FieldContent>
              <SettingsGroup>
                <SettingsRow
                  label={
                    currentLocale === "mn" ? "НДШ тооцоо" : "Social Insurance"
                  }
                  description={
                    currentLocale === "mn"
                      ? "Нийгмийн даатгалын шимтгэл"
                      : "Payroll tax tracking"
                  }
                >
                  <Switch
                    id="ndshEnabled"
                    checked={watchedNdshEnabled}
                    onCheckedChange={(checked) =>
                      rhfForm.setValue("ndshEnabled", checked)
                    }
                  />
                </SettingsRow>
              </SettingsGroup>
            </FieldContent>
          </Field>

          {/* НДШ Rates - only shown when enabled */}
          {watchedNdshEnabled && (
            <>
              <Field>
                <FieldLabel>
                  {currentLocale === "mn" ? "Ажил олгогч НДШ" : "Employer НДШ"}
                </FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <NumericInput
                      min={0}
                      max={100}
                      step={0.1}
                      className="w-24"
                      value={Number(rhfForm.watch("ndshEmployerRate")) || 0}
                      onChange={(val) =>
                        rhfForm.setValue("ndshEmployerRate", String(val))
                      }
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>
                  {currentLocale === "mn" ? "Ажилтан НДШ" : "Employee НДШ"}
                </FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <NumericInput
                      min={0}
                      max={100}
                      step={0.1}
                      className="w-24"
                      value={Number(rhfForm.watch("ndshEmployeeRate")) || 0}
                      onChange={(val) =>
                        rhfForm.setValue("ndshEmployeeRate", String(val))
                      }
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </FieldContent>
              </Field>
            </>
          )}

          <Field className="sm:col-span-2">
            <FieldContent>
              <SettingsGroup>
                <SettingsRow
                  label={currentLocale === "mn" ? "Э-Баримт" : "E-Invoice"}
                  description={
                    currentLocale === "mn"
                      ? "Цахим нэхэмжлэл (Татварын ерөнхий газар)"
                      : "Electronic invoice (General Taxation Authority)"
                  }
                >
                  <Switch
                    id="einvoiceEnabled"
                    checked={watchedEinvoiceEnabled}
                    onCheckedChange={(checked) =>
                      rhfForm.setValue("einvoiceEnabled", checked)
                    }
                  />
                </SettingsRow>
              </SettingsGroup>
            </FieldContent>
          </Field>

          {/* E-Invoice Settings - only shown when enabled */}
          {watchedEinvoiceEnabled && (
            <>
              <Field>
                <FieldLabel>
                  {currentLocale === "mn" ? "Merchant ID" : "Merchant ID"}
                </FieldLabel>
                <FieldContent>
                  <Input
                    placeholder={t("merchantIdPlaceholder")}
                    {...rhfForm.register("einvoiceMerchantId")}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>
                  {currentLocale === "mn" ? "API Түлхүүр" : "API Key"}
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="password"
                    placeholder={t("apiKeyPlaceholder")}
                    {...rhfForm.register("einvoiceApiKey")}
                  />
                </FieldContent>
              </Field>
            </>
          )}

          <Field data-invalid={!!rhfForm.formState.errors.timezone}>
            <FieldLabel htmlFor="timezone">{t("timezone")}</FieldLabel>
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
            <FieldLabel htmlFor="dateFormat">{t("dateFormat")}</FieldLabel>
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
            <FieldLabel htmlFor="language">{t("defaultLanguage")}</FieldLabel>
            <FieldContent>
              <Select
                value={rhfForm.watch("language")}
                onValueChange={(value) =>
                  value && rhfForm.setValue("language", value)
                }
              >
                <SelectTrigger
                  id="language"
                  className="h-9 w-full"
                  aria-invalid={!!rhfForm.formState.errors.language}
                >
                  <Globe className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={t("selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mn">{t("languageMn")}</SelectItem>
                  <SelectItem value="en">{t("languageEn")}</SelectItem>
                </SelectContent>
              </Select>
              {rhfForm.formState.errors.language && (
                <FieldError>
                  {rhfForm.formState.errors.language.message}
                </FieldError>
              )}
              {currentLocale !== watchedLanguage && (
                <Typography.Muted className="text-xs text-muted-foreground">
                  {t("languageChangeAfterSave")}
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

        <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
          <Typography.Muted className="text-xs text-muted-foreground">
            {watchedLanguage !== currentLocale
              ? t("langWillReload")
              : t("allChangesSaved")}
          </Typography.Muted>
          <Button
            type="submit"
            disabled={saving}
            size="sm"
            className="min-w-20"
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </SettingsBlock>
  );
}
