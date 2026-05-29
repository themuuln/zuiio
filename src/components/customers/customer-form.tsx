"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { inputProps, formatMongolianPhone } from "@/lib/form-ux";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreateCustomer } from "@/lib/queries/use-wizard-data";
import { Typography } from "@/components/ui/typography";
import type { Customer, CreateCustomerParams } from "@/lib/types";

type CustomerType = "individual" | "company";

export type CustomerFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreateCustomerParams>;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
};

const initialForm: CreateCustomerParams = {
  type: "individual",
  firstName: "",
  lastName: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  source: "",
  notes: "",
};

export function CustomerForm({
  mode = "full",
  initialData,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const t = useTranslations("customers");
  const commonT = useTranslations("common");

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [form, setForm] = useState<CreateCustomerParams>({
    ...initialForm,
    ...initialData,
  });

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflictInfo, setConflictInfo] = useState<{
    field: "phone" | "email";
    existingCustomerId: string;
  } | null>(null);

  const createCustomerMutation = useCreateCustomer(orgId);

  // Sync mode if prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Clear errors on input or mode changes
  useEffect(() => {
    setError(null);
    setFieldErrors({});
    setConflictInfo(null);
  }, [form, currentMode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orgId) {
      setError(t("noOrganization"));
      return;
    }

    // Validation
    const errors: Record<string, string> = {};

    if (currentMode === "quick") {
      if (!form.firstName?.trim()) {
        errors.firstName = t("firstNameRequired", {
          fallback: "First name is required",
        });
      }
      const digits = (form.phone ?? "").replace(/\D/g, "");
      if (!form.phone?.trim()) {
        errors.phone = t("phoneRequired", { fallback: "Phone is required" });
      } else if (digits.length !== 8) {
        errors.phone = t("phoneMustBe8Digits", {
          fallback: "Must be 8 digits",
        });
      }
    } else {
      // Full Mode validation
      if (
        form.type === "individual" &&
        !form.firstName?.trim() &&
        !form.lastName?.trim()
      ) {
        errors.firstName = t("firstNameRequired", {
          fallback: "First or last name is required",
        });
      }
      if (
        form.type === "company" &&
        !form.companyName?.trim() &&
        !form.contactPerson?.trim()
      ) {
        errors.companyName = t("companyNameRequired", {
          fallback: "Company name or contact person is required",
        });
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setConflictInfo(null);

    try {
      // Clean up body
      const payload: CreateCustomerParams = {
        type: currentMode === "quick" ? "individual" : form.type,
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        companyName:
          currentMode === "quick"
            ? form.companyName?.trim() || undefined
            : form.type === "company"
              ? form.companyName?.trim() || undefined
              : undefined,
        contactPerson:
          currentMode !== "quick" && form.type === "company"
            ? form.contactPerson?.trim() || undefined
            : undefined,
        email: form.email?.trim() || undefined,
        address:
          currentMode === "full"
            ? form.address?.trim() || undefined
            : undefined,
        notes: form.notes?.trim() || undefined,
        source:
          currentMode === "full" ? form.source?.trim() || undefined : undefined,
      };

      const customer = await createCustomerMutation.mutateAsync(payload);
      onSuccess?.(customer);
    } catch (err: any) {
      if (err.code === "CONFLICT") {
        const field = err.message.toLowerCase().includes("phone")
          ? ("phone" as const)
          : ("email" as const);
        setConflictInfo({
          field,
          existingCustomerId: err.details?.existingCustomerId ?? null,
        });
      }
      setError(err.message || "Failed to save customer");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                ? "Phone number already exists."
                : "Email address already exists."}
            </span>{" "}
            Please search for the existing customer or use a different value.
          </div>
        </div>
      )}

      {error && !conflictInfo && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {currentMode === "full" && (
          <div>
            <Label
              className="mb-1 block text-sm font-medium"
              htmlFor="customer-type"
            >
              {t("type")} <span className="text-destructive">*</span>
            </Label>
            <Select
              id="customer-type"
              value={form.type}
              onValueChange={(val) =>
                setForm((current) => ({
                  ...current,
                  type: val as CustomerType,
                }))
              }
            >
              <SelectTrigger className="w-full h-11" aria-label="Customer type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{t("individual")}</SelectItem>
                <SelectItem value="company">{t("company")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(currentMode === "quick" || form.type === "individual") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="firstName"
              >
                {t("firstName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={form.firstName || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, firstName: e.target.value }))
                }
                className={`h-11 ${fieldErrors.firstName ? "border-destructive" : ""}`}
                placeholder="Bat"
                autoComplete="given-name"
                autoFocus={currentMode === "quick"}
              />
              {fieldErrors.firstName && (
                <Typography.Text className="text-xs text-destructive mt-1">
                  {fieldErrors.firstName}
                </Typography.Text>
              )}
            </div>
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="lastName"
              >
                {t("lastName")}
              </Label>
              <Input
                id="lastName"
                value={form.lastName || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, lastName: e.target.value }))
                }
                className="h-11"
                placeholder="Erdene"
                autoComplete="family-name"
              />
            </div>
          </div>
        )}

        {currentMode === "full" && form.type === "company" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="companyName"
              >
                {t("companyName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={form.companyName || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, companyName: e.target.value }))
                }
                className={`h-11 ${fieldErrors.companyName ? "border-destructive" : ""}`}
                placeholder="Fleet Co."
              />
              {fieldErrors.companyName && (
                <Typography.Text className="text-xs text-destructive mt-1">
                  {fieldErrors.companyName}
                </Typography.Text>
              )}
            </div>
            <div>
              <Label
                className="mb-1 block text-sm font-medium"
                htmlFor="contactPerson"
              >
                {t("contactPerson")}
              </Label>
              <Input
                id="contactPerson"
                value={form.contactPerson || ""}
                onChange={(e) =>
                  setForm((c) => ({ ...c, contactPerson: e.target.value }))
                }
                className="h-11"
                placeholder="B. Batbold"
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1 block text-sm font-medium" htmlFor="phone">
              {t("phone")}{" "}
              {currentMode === "quick" && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id="phone"
              value={form.phone || ""}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  phone: formatMongolianPhone(e.target.value),
                }))
              }
              className={`h-11 ${fieldErrors.phone ? "border-destructive" : ""}`}
              placeholder="99112233"
              {...inputProps("phone")}
              type="tel"
            />
            {fieldErrors.phone && (
              <Typography.Text className="text-xs text-destructive mt-1">
                {fieldErrors.phone}
              </Typography.Text>
            )}
          </div>
          <div>
            <Label className="mb-1 block text-sm font-medium" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              id="email"
              value={form.email || ""}
              onChange={(e) =>
                setForm((c) => ({ ...c, email: e.target.value }))
              }
              className="h-11"
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          </div>
        </div>

        {currentMode === "quick" && (
          <div>
            <Label className="mb-1 block text-sm font-medium" htmlFor="company">
              Company
            </Label>
            <Input
              id="company"
              value={form.companyName || ""}
              onChange={(e) =>
                setForm((c) => ({ ...c, companyName: e.target.value }))
              }
              className="h-11"
              placeholder="Optional"
              autoComplete="organization"
            />
          </div>
        )}

        {currentMode === "full" && (
          <div>
            <Label className="mb-1 block text-sm font-medium" htmlFor="address">
              {t("address")}
            </Label>
            <Input
              id="address"
              value={form.address || ""}
              onChange={(e) =>
                setForm((c) => ({ ...c, address: e.target.value }))
              }
              className="h-11"
              placeholder="Ulaanbaatar, Mongolia"
            />
          </div>
        )}

        {currentMode === "full" && (
          <div>
            <Label className="mb-1 block text-sm font-medium" htmlFor="source">
              {t("source")}
            </Label>
            <Select
              id="source"
              value={form.source}
              onValueChange={(val) =>
                setForm((c) => ({ ...c, source: val ?? undefined }))
              }
            >
              <SelectTrigger
                className="w-full h-11"
                aria-label="Customer source"
              >
                <SelectValue placeholder="Select how they found you" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="recommendation">Friend/Family</SelectItem>
                <SelectItem value="passing_by">Passing by</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="mb-1 block text-sm font-medium" htmlFor="notes">
            {t("notes")}
          </Label>
          <Textarea
            id="notes"
            value={form.notes || ""}
            onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            placeholder="Optional notes"
            rows={2}
          />
        </div>
      </div>

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
          type="submit"
          disabled={createCustomerMutation.isPending}
          className="h-11 px-6 min-w-[140px]"
        >
          {createCustomerMutation.isPending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            t(currentMode === "quick" ? "createCustomer" : "createCustomer")
          )}
        </Button>
      </div>
    </form>
  );
}
