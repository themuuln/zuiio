"use client";

import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
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
import { useSuppliers, useUpdateSupplier } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
import { Typography } from "@/components/ui/typography";

interface SupplierDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
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

const emptyForm: SupplierForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  taxId: "",
  paymentTerms: "",
  notes: "",
};

export function SupplierDetailSheet({
  open,
  onOpenChange,
  supplierId,
}: SupplierDetailSheetProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const { data: suppliers = [], isLoading: suppliersLoading } =
    useSuppliers(orgId);
  const updateSupplier = useUpdateSupplier(orgId);

  const supplier = suppliers.find((s) => s.id === supplierId);

  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Populate form when supplier loads
  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name,
        contactPerson: supplier.contact_person ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        taxId: supplier.tax_id ?? "",
        paymentTerms: supplier.payment_terms ?? "",
        notes: supplier.notes ?? "",
      });
    }
  }, [supplier]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setForm(emptyForm);
        setFieldErrors({});
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;

    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = t("nameRequired");
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateSupplier.mutateAsync({
        id: supplierId,
        body: {
          name: form.name.trim(),
          contact_person: form.contactPerson || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          tax_id: form.taxId || undefined,
          payment_terms: form.paymentTerms || undefined,
          notes: form.notes || undefined,
        },
      });
      toast.success(t("supplierUpdated"));
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
    }
  };

  const isLoading = suppliersLoading && open;
  const notFound = open && !suppliersLoading && !supplier;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Pencil className="size-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">{t("editSupplier")}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {supplier?.name ?? "..."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          id="supplier-detail-sheet-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto min-h-0"
        >
          <div className="p-4 flex flex-col gap-4">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            ) : notFound ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <Typography.Muted className="text-muted-foreground">
                  {t("supplierNotFound")}
                </Typography.Muted>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  {t("cancel")}
                </Button>
              </div>
            ) : (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="sd-name">
                    {t("name")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="sd-name"
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
                    <FieldLabel htmlFor="sd-contact">
                      {t("contactPerson")}
                    </FieldLabel>
                    <Input
                      id="sd-contact"
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
                    <FieldLabel htmlFor="sd-phone">{t("phone")}</FieldLabel>
                    <Input
                      id="sd-phone"
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
                  <FieldLabel htmlFor="sd-email">{t("email")}</FieldLabel>
                  <Input
                    id="sd-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder={t("emailPlaceholder")}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="sd-address">{t("address")}</FieldLabel>
                  <Input
                    id="sd-address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder={t("addressPlaceholder")}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="sd-tax-id">Tax ID</FieldLabel>
                    <Input
                      id="sd-tax-id"
                      value={form.taxId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, taxId: e.target.value }))
                      }
                      placeholder={t("taxIdPlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sd-payment-terms">
                      Payment Terms
                    </FieldLabel>
                    <Input
                      id="sd-payment-terms"
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
                  <FieldLabel htmlFor="sd-notes">{t("notes")}</FieldLabel>
                  <Input
                    id="sd-notes"
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
              form="supplier-detail-sheet-form"
              className="flex-1 gap-2"
              disabled={updateSupplier.isPending || isLoading || notFound}
            >
              {updateSupplier.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              {updateSupplier.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
