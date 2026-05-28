"use client";

import { Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateSupplier } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
import { Typography } from "@/components/ui/typography";

interface NewSupplierSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierForm {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
}

const initialForm: SupplierForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  taxId: "",
  paymentTerms: "",
  notes: "",
};

export function NewSupplierSheet({
  open,
  onOpenChange,
}: NewSupplierSheetProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const createSupplier = useCreateSupplier(orgId);
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setForm(initialForm);
        setFieldErrors({});
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = t("nameRequired");
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await createSupplier.mutateAsync({
        name: form.name.trim(),
        contact_person: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        tax_id: form.taxId || undefined,
        payment_terms: form.paymentTerms || undefined,
        notes: form.notes || undefined,
      });
      toast.success(t("supplierCreated"));
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Truck className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">{t("newSupplier")}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {t("newSupplierDescription")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          id="new-supplier-sheet-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto min-h-0"
        >
          <div className="p-4 flex flex-col gap-4">
            {orgQuery.isPending ? (
              <div className="flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
                {/* Contact + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-9 w-full" />
                </div>
                {/* Address */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-18" />
                  <Skeleton className="h-9 w-full" />
                </div>
                {/* Tax ID + Payment Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ) : (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="supplier-name">
                    {t("name")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="supplier-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder={t("namePlaceholder")}
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && (
                    <Typography.Text className="text-xs text-destructive mt-1">
                      {fieldErrors.name}
                    </Typography.Text>
                  )}
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="supplier-contact">
                      {t("contactPerson")}
                    </FieldLabel>
                    <Input
                      id="supplier-contact"
                      value={form.contactPerson}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          contactPerson: e.target.value,
                        }))
                      }
                      placeholder={t("contactPersonPlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="supplier-phone">
                      {t("phone")}
                    </FieldLabel>
                    <Input
                      id="supplier-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          phone: formatMongolianPhone(e.target.value),
                        }))
                      }
                      placeholder={t("phonePlaceholder")}
                      {...inputProps("phone")}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="supplier-email">{t("email")}</FieldLabel>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder={t("emailPlaceholder")}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="supplier-address">
                    {t("address")}
                  </FieldLabel>
                  <Input
                    id="supplier-address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder={t("addressPlaceholder")}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="supplier-tax-id">Tax ID</FieldLabel>
                    <Input
                      id="supplier-tax-id"
                      value={form.taxId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, taxId: e.target.value }))
                      }
                      placeholder={t("taxIdPlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="supplier-payment-terms">
                      Payment Terms
                    </FieldLabel>
                    <Input
                      id="supplier-payment-terms"
                      value={form.paymentTerms}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          paymentTerms: e.target.value,
                        }))
                      }
                      placeholder={t("paymentTermsPlaceholder")}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="supplier-notes">{t("notes")}</FieldLabel>
                  <Input
                    id="supplier-notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder={t("notesPlaceholder")}
                  />
                </Field>
              </FieldGroup>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form="new-supplier-sheet-form"
              className="flex-1 gap-2"
              disabled={createSupplier.isPending}
            >
              {createSupplier.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Truck className="size-4" />
              )}
              {createSupplier.isPending ? t("saving") : t("create")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
