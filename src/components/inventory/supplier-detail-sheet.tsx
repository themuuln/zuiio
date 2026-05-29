"use client";

import { Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { DetailSheetHeader } from "@/components/ui/detail-sheet-header";
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useSuppliers, useUpdateSupplier } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Schema ───────────────────────────────────────────────────

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const emptyForm: SupplierFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  taxId: "",
  paymentTerms: "",
  notes: "",
};

// ── Component ────────────────────────────────────────────────

interface SupplierDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
}

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

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: emptyForm,
  });

  // Populate form when supplier loads
  useEffect(() => {
    if (supplier) {
      form.reset({
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
  }, [supplier, form.reset]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        form.reset(emptyForm);
      }
      onOpenChange(value);
    },
    [onOpenChange, form],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!supplierId) return;

    try {
      await updateSupplier.mutateAsync({
        id: supplierId,
        body: {
          name: data.name.trim(),
          contact_person: data.contactPerson || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          tax_id: data.taxId || undefined,
          payment_terms: data.paymentTerms || undefined,
          notes: data.notes || undefined,
        },
      });
      toast.success(t("supplierUpdated"));
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
    }
  });

  const isLoading = suppliersLoading && open;
  const notFound = open && !suppliersLoading && !supplier;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <DetailSheetHeader
            icon={Pencil}
            title={
              <>
                <SheetTitle className="text-base">
                  {t("editSupplier")}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {supplier?.name ?? "..."}
                </SheetDescription>
              </>
            }
          />
        </SheetHeader>

        <form
          id="supplier-detail-sheet-form"
          onSubmit={onSubmit}
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
                {/* Name — required */}
                <Field data-invalid={!!form.formState.errors.name}>
                  <FieldLabel>
                    {t("name")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="sd-name"
                      placeholder={t("namePlaceholder")}
                      aria-invalid={!!form.formState.errors.name}
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <FieldError>
                        {form.formState.errors.name.message}
                      </FieldError>
                    )}
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact Person — optional */}
                  <Field>
                    <FieldLabel>{t("contactPerson")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="sd-contact"
                        placeholder={t("contactPersonPlaceholder")}
                        {...form.register("contactPerson")}
                      />
                    </FieldContent>
                  </Field>

                  {/* Phone — optional */}
                  <Field>
                    <FieldLabel>{t("phone")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="sd-phone"
                        type="tel"
                        placeholder={t("phonePlaceholder")}
                        {...inputProps("phone")}
                        {...form.register("phone")}
                      />
                    </FieldContent>
                  </Field>
                </div>

                {/* Email — optional */}
                <Field>
                  <FieldLabel>{t("email")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="sd-email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      {...form.register("email")}
                    />
                  </FieldContent>
                </Field>

                {/* Address — optional */}
                <Field>
                  <FieldLabel>{t("address")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="sd-address"
                      placeholder={t("addressPlaceholder")}
                      {...form.register("address")}
                    />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tax ID — optional */}
                  <Field>
                    <FieldLabel>Tax ID</FieldLabel>
                    <FieldContent>
                      <Input
                        id="sd-tax-id"
                        placeholder={t("taxIdPlaceholder")}
                        {...inputProps("taxId")}
                        {...form.register("taxId")}
                      />
                    </FieldContent>
                  </Field>

                  {/* Payment Terms — optional */}
                  <Field>
                    <FieldLabel>Payment Terms</FieldLabel>
                    <FieldContent>
                      <Input
                        id="sd-payment-terms"
                        placeholder={t("paymentTermsPlaceholder")}
                        {...form.register("paymentTerms")}
                      />
                    </FieldContent>
                  </Field>
                </div>

                {/* Notes — optional */}
                <Field>
                  <FieldLabel>{t("notes")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="sd-notes"
                      placeholder={t("notesPlaceholder")}
                      {...form.register("notes")}
                    />
                  </FieldContent>
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
