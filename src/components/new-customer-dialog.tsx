"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inputProps, formatMongolianPhone } from "@/lib/form-ux";
import { useRouter } from "@/lib/i18n/navigation";
import { usePageHeader } from "@/hooks/use-page-header";
import { customerKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { Typography } from "@/components/ui/typography";

type CustomerType = "individual" | "company";

type CustomerFormState = {
  type: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  notes: string;
};

const initialForm: CustomerFormState = {
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

type NewCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewCustomerDialog({
  open,
  onOpenChange,
}: NewCustomerDialogProps) {
  const { replace } = useRouter();
  const { setDetailCustomerId } = usePageHeader();
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflictInfo, setConflictInfo] = useState<{
    field: "phone" | "email";
    existingCustomerId: string;
  } | null>(null);
  const [form, setForm] = useState<CustomerFormState>(initialForm);

  // Clear errors on any input change
  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null);
      setFieldErrors({});
      setConflictInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);
  const t = useTranslations("customers");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orgId) {
      setError(t("noOrganization"));
      return;
    }

    // Client-side validation
    const errors: Record<string, string> = {};
    if (
      form.type === "individual" &&
      !form.firstName.trim() &&
      !form.lastName.trim()
    ) {
      errors.firstName = t("firstNameRequired", {
        fallback: "First or last name is required",
      });
    }
    if (
      form.type === "company" &&
      !form.companyName.trim() &&
      !form.contactPerson.trim()
    ) {
      errors.companyName = t("companyNameRequired", {
        fallback: "Company name or contact person is required",
      });
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError(null);
    setConflictInfo(null);

    try {
      const response = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();

      if (json.error) {
        if (json.error.code === "CONFLICT") {
          const field = json.error.message.toLowerCase().includes("phone")
            ? ("phone" as const)
            : ("email" as const);
          setConflictInfo({
            field,
            existingCustomerId: json.error.details?.existingCustomerId ?? null,
          });
          toast.error(json.error.message);
          return;
        }
        toast.error(json.error.message);
        setError(json.error.message);
        return;
      }

      toast.success("Customer created");
      queryClient.invalidateQueries({
        queryKey: customerKeys.all(orgId),
      });
      onOpenChange(false);
      replace("/dashboard/customers");
      setDetailCustomerId(json.data.id);
    } catch {
      toast.error("Failed to create customer");
      setError("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setForm(initialForm);
      setError(null);
      setConflictInfo(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>
            Create a customer record before check-in or invoicing.
          </DialogDescription>
        </DialogHeader>

        {conflictInfo && (
          <Card className="border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <div className="text-sm">
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  A customer with this{" "}
                  {conflictInfo.field === "phone" ? "phone number" : "email"}{" "}
                  already exists.
                </span>{" "}
                {conflictInfo.existingCustomerId ? (
                  <span
                    className="font-medium text-amber-700 underline hover:cursor-pointer hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                    onClick={() => {
                      onOpenChange(false);
                      setDetailCustomerId(conflictInfo.existingCustomerId!);
                    }}
                  >
                    View existing customer
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">
                    Search for them instead.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {error && !conflictInfo && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <Typography.Text className="text-sm text-destructive">
                {error}
              </Typography.Text>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("details")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="type"
                  >
                    {t("type")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="type"
                    value={form.type}
                    onValueChange={(val) =>
                      setForm((current) => ({
                        ...current,
                        type: (val ?? "individual") as CustomerType,
                      }))
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label="Customer type"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        {t("individual")}
                      </SelectItem>
                      <SelectItem value="company">{t("company")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.type === "company" ? (
                  <>
                    <div>
                      <Label
                        className="mb-1 block text-sm font-medium"
                        htmlFor="companyName"
                      >
                        {t("companyName")}
                        {!form.type || form.type === "company" ? (
                          <span className="text-destructive">*</span>
                        ) : null}
                      </Label>
                      <Input
                        id="companyName"
                        value={form.companyName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            companyName: event.target.value,
                          }))
                        }
                        className={`h-11 ${fieldErrors.companyName ? "border-destructive" : ""}`}
                        placeholder="Fleet Co."
                        aria-invalid={!!fieldErrors.companyName}
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
                        value={form.contactPerson}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contactPerson: event.target.value,
                          }))
                        }
                        className="h-11"
                        placeholder="B. Batbold"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label
                        className="mb-1 block text-sm font-medium"
                        htmlFor="firstName"
                      >
                        {t("firstName")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }))
                        }
                        className={`h-11 ${fieldErrors.firstName ? "border-destructive" : ""}`}
                        placeholder="Bat"
                        aria-invalid={!!fieldErrors.firstName}
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
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }))
                        }
                        className="h-11"
                        placeholder="Erdene"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="phone"
                  >
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: formatMongolianPhone(event.target.value),
                      }))
                    }
                    className="h-11"
                    placeholder="99112233"
                    {...inputProps("phone")}
                    type="tel"
                  />
                </div>
                <div>
                  <Label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="email"
                  >
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="h-11"
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="address"
                  >
                    {t("address")}
                  </Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="h-11"
                    placeholder="Ulaanbaatar"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="source"
                  >
                    {t("source")}
                  </Label>
                  <Select
                    id="source"
                    value={form.source || null}
                    onValueChange={(val) =>
                      setForm((current) => ({
                        ...current,
                        source: val ?? "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full" aria-label="Source">
                      <SelectValue placeholder={t("sourcePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral">
                        {t("sourceReferral")}
                      </SelectItem>
                      <SelectItem value="website">
                        {t("sourceWebsite")}
                      </SelectItem>
                      <SelectItem value="walk-in">
                        {t("sourceWalkIn")}
                      </SelectItem>
                      <SelectItem value="social_media">
                        {t("sourceSocialMedia")}
                      </SelectItem>
                      <SelectItem value="phone">{t("sourcePhone")}</SelectItem>
                      <SelectItem value="other">{t("sourceOther")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label
                    className="mb-1 block text-sm font-medium"
                    htmlFor="notes"
                  >
                    {t("notes")}
                  </Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Preferred contact time, fleet details, or special notes"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="default" disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  {saving ? t("saving") : t("addCustomer")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  );
}
