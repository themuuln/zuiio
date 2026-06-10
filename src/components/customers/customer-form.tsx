"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreateCustomer } from "@/lib/queries/use-wizard-data";
import type { CreateCustomerParams, Customer } from "@/lib/types";

// ── Schema ───────────────────────────────────────────────────
// Base schema with all optional — mode-specific validation runs in handleSubmit.

const customerSchema = z.object({
  type: z.enum(["individual", "company"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// ── Component ────────────────────────────────────────────────

export type CustomerFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreateCustomerParams>;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
  /** When true, render a <div> instead of <form> to avoid nested form HTML. */
  disableFormWrapper?: boolean;
};

export function CustomerForm({
  mode = "full",
  initialData,
  onSuccess,
  onCancel,
  disableFormWrapper,
}: CustomerFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const t = useTranslations("customers");
  const commonT = useTranslations("common");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [error, setError] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{
    field: "phone" | "email";
    existingCustomerId: string;
  } | null>(null);

  const createCustomerMutation = useCreateCustomer(orgId);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      type: initialData?.type ?? "individual",
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      companyName: initialData?.companyName ?? "",
      contactPerson: initialData?.contactPerson ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      address: initialData?.address ?? "",
      notes: initialData?.notes ?? "",
      source: initialData?.source ?? "",
    },
  });

  // Sync mode if prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Clear server errors on mode change
  useEffect(() => {
    setError(null);
    setConflictInfo(null);
  }, []);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) {
      setError(t("noOrganization"));
      return;
    }

    // ── Mode-specific validation ──
    if (currentMode === "quick") {
      if (!data.firstName?.trim()) {
        form.setError("firstName", {
          message: t("firstNameRequired", {
            fallback: "First name is required",
          }),
        });
        return;
      }
      const digits = (data.phone ?? "").replace(/\D/g, "");
      if (!data.phone?.trim()) {
        form.setError("phone", {
          message: t("phoneRequired", { fallback: "Phone is required" }),
        });
        return;
      } else if (digits.length !== 8) {
        form.setError("phone", {
          message: t("phoneMustBe8Digits", { fallback: "Must be 8 digits" }),
        });
        return;
      }
    } else {
      // Full mode validation
      if (
        data.type === "individual" &&
        !data.firstName?.trim() &&
        !data.lastName?.trim()
      ) {
        form.setError("firstName", {
          message: t("firstNameRequired", {
            fallback: "First or last name is required",
          }),
        });
        return;
      }
      if (
        data.type === "company" &&
        !data.companyName?.trim() &&
        !data.contactPerson?.trim()
      ) {
        form.setError("companyName", {
          message: t("companyNameRequired", {
            fallback: "Company name or contact person is required",
          }),
        });
        return;
      }
    }

    setError(null);
    setConflictInfo(null);

    // ── Fuzzy-check duplicate phone/email (warn only, don't block) ──
    const checkPhone = data.phone?.trim();
    const checkEmail = data.email?.trim();

    if (checkPhone || checkEmail) {
      try {
        const checkRes = await fetch(
          `/api/organizations/${orgId}/customers?q=${encodeURIComponent(
            checkPhone || checkEmail || "",
          )}&pageSize=10`,
        );
        const checkJson = await checkRes.json();
        const existingList = (checkJson?.data?.data ?? []) as Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          phone: string | null;
          email: string | null;
        }>;

        if (checkPhone) {
          const phoneMatch = existingList.find((c) => c.phone === checkPhone);
          if (phoneMatch) {
            const name =
              [phoneMatch.first_name, phoneMatch.last_name]
                .filter(Boolean)
                .join(" ") ||
              phoneMatch.company_name ||
              phoneMatch.phone;
            toast.warning(
              t("phoneAlreadyExists", { name: String(name || "") }),
            );
          }
        }

        if (checkEmail) {
          const emailMatch = existingList.find((c) => c.email === checkEmail);
          if (emailMatch) {
            const name =
              [emailMatch.first_name, emailMatch.last_name]
                .filter(Boolean)
                .join(" ") ||
              emailMatch.company_name ||
              emailMatch.email;
            toast.warning(
              t("emailAlreadyExists", { name: String(name || "") }),
            );
          }
        }
      } catch {
        // Silently ignore duplication check failures — don't block creation
      }
    }

    try {
      const payload: CreateCustomerParams = {
        type: currentMode === "quick" ? "individual" : data.type,
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        companyName:
          currentMode === "quick"
            ? data.companyName?.trim() || undefined
            : data.type === "company"
              ? data.companyName?.trim() || undefined
              : undefined,
        contactPerson:
          currentMode !== "quick" && data.type === "company"
            ? data.contactPerson?.trim() || undefined
            : undefined,
        email: data.email?.trim() || undefined,
        address:
          currentMode === "full"
            ? data.address?.trim() || undefined
            : undefined,
        notes: data.notes?.trim() || undefined,
        source:
          currentMode === "full" ? data.source?.trim() || undefined : undefined,
      };

      const customer = await createCustomerMutation.mutateAsync(payload);
      onSuccess?.(customer);
    } catch (err: any) {
      setError(err.message || t("failedToSave"));
    }
  });

  // Inline mode: use <div> to avoid nested form HTML
  const Wrapper = disableFormWrapper ? "div" : "form";
  const wrapperProps = disableFormWrapper
    ? { className: "flex flex-col gap-4" }
    : { onSubmit, className: "flex flex-col gap-4" };

  const watchedType = form.watch("type");
  const watchedSource = form.watch("source");
  const phoneValue = form.watch("phone");
  const selectedTypeLabel = t(watchedType);

  return (
    <Wrapper {...wrapperProps}>
      {/* ── Mode Toggle Tabs ── */}
      <Tabs
        value={currentMode}
        onValueChange={(val) => setCurrentMode(val as "quick" | "full")}
        className="w-full shrink-0"
      >
        <TabsList className="flex w-full h-9 p-0.5 rounded-lg bg-muted border border-border">
          <TabsTrigger
            value="quick"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            {t("quickCreateCustomer", { fallback: "Quick" })}
          </TabsTrigger>
          <TabsTrigger
            value="full"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            {t("createCustomer", { fallback: "Full Details" })}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {conflictInfo && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-400 bg-amber-50 p-3.5 dark:border-amber-700/50 dark:bg-amber-950/20">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">
              {conflictInfo.field === "phone"
                ? t("phoneConflictTitle")
                : t("emailConflictTitle")}
            </span>{" "}
            {t("conflictHint")}
          </div>
        </div>
      )}

      {error && !conflictInfo && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <FieldGroup>
        {currentMode === "full" && (
          <Field>
            <FieldLabel>
              {t("type")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Select
                value={watchedType}
                onValueChange={(val) =>
                  form.setValue("type", val as "individual" | "company")
                }
              >
                <SelectTrigger
                  className="w-full h-11"
                  aria-label={t("customerTypeAria")}
                >
                  <SelectValue>{selectedTypeLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">{t("individual")}</SelectItem>
                  <SelectItem value="company">{t("company")}</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}

        {(currentMode === "quick" || watchedType === "individual") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.firstName}>
              <FieldLabel>
                {t("firstName")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("firstNamePlaceholder")}
                  autoComplete="given-name"
                  autoFocus={currentMode === "quick"}
                  aria-invalid={!!form.formState.errors.firstName}
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <FieldError>
                    {form.formState.errors.firstName.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("lastName")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("lastNamePlaceholder")}
                  autoComplete="family-name"
                  {...form.register("lastName")}
                />
              </FieldContent>
            </Field>
          </div>
        )}

        {currentMode === "full" && watchedType === "company" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.companyName}>
              <FieldLabel>
                {t("companyName")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("companyNamePlaceholder")}
                  aria-invalid={!!form.formState.errors.companyName}
                  {...form.register("companyName")}
                />
                {form.formState.errors.companyName && (
                  <FieldError>
                    {form.formState.errors.companyName.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("contactPerson")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("contactPersonPlaceholder")}
                  {...form.register("contactPerson")}
                />
              </FieldContent>
            </Field>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={!!form.formState.errors.phone}>
            <FieldLabel>
              {t("phone")}{" "}
              {currentMode === "quick" && (
                <span className="text-destructive">*</span>
              )}
            </FieldLabel>
            <FieldContent>
              <Input
                value={phoneValue}
                onChange={(e) =>
                  form.setValue("phone", formatMongolianPhone(e.target.value))
                }
                placeholder={t("phonePlaceholder")}
                type="tel"
                aria-invalid={!!form.formState.errors.phone}
                {...inputProps("phone")}
              />
              {form.formState.errors.phone && (
                <FieldError>{form.formState.errors.phone.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{t("email")}</FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("emailPlaceholder")}
                type="email"
                {...inputProps("email")}
                {...form.register("email")}
              />
            </FieldContent>
          </Field>
        </div>

        {currentMode === "quick" && (
          <Field>
            <FieldLabel>{t("company")}</FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("optional")}
                {...inputProps("companyName")}
                {...form.register("companyName")}
              />
            </FieldContent>
          </Field>
        )}

        {currentMode === "full" && (
          <Field>
            <FieldLabel>{t("address")}</FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("addressPlaceholder")}
                {...inputProps("address")}
                {...form.register("address")}
              />
            </FieldContent>
          </Field>
        )}

        {currentMode === "full" && (
          <Field>
            <FieldLabel>{t("source")}</FieldLabel>
            <FieldContent>
              <Select
                value={watchedSource || ""}
                onValueChange={(val) =>
                  form.setValue("source", val ?? undefined)
                }
              >
                <SelectTrigger
                  className="w-full h-11"
                  aria-label={t("customerSourceAria")}
                >
                  <SelectValue placeholder={t("sourceSelectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">
                    {t("sourceFacebook")}
                  </SelectItem>
                  <SelectItem value="google">{t("sourceGoogle")}</SelectItem>
                  <SelectItem value="recommendation">
                    {t("sourceFriendFamily")}
                  </SelectItem>
                  <SelectItem value="passing_by">
                    {t("sourcePassingBy")}
                  </SelectItem>
                  <SelectItem value="other">{t("sourceOther")}</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}

        <Field>
          <FieldLabel>{t("notes")}</FieldLabel>
          <FieldContent>
            <Textarea
              placeholder={t("notesOptional")}
              rows={2}
              {...form.register("notes")}
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 mt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="h-11 px-6"
          >
            {commonT("cancel")}
          </Button>
        )}
        <Button
          type={disableFormWrapper ? "button" : "submit"}
          onClick={disableFormWrapper ? () => onSubmit() : undefined}
          disabled={createCustomerMutation.isPending}
          className="h-11 px-6 min-w-[140px]"
        >
          {createCustomerMutation.isPending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="size-4 animate-spin" />
              {commonT("saving")}
            </span>
          ) : (
            t(currentMode === "quick" ? "createCustomer" : "createCustomer")
          )}
        </Button>
      </div>
    </Wrapper>
  );
}
