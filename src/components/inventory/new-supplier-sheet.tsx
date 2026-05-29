"use client";

import { Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
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
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCreateSupplier } from "@/lib/queries/use-inventory";
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

// ── Component ────────────────────────────────────────────────

interface NewSupplierSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSupplierSheet({
  open,
  onOpenChange,
}: NewSupplierSheetProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const createSupplier = useCreateSupplier(orgId);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxId: "",
      paymentTerms: "",
      notes: "",
    },
  });

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        form.reset();
      }
      onOpenChange(value);
    },
    [onOpenChange, form],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createSupplier.mutateAsync({
        name: data.name.trim(),
        contact_person: data.contactPerson || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        tax_id: data.taxId || undefined,
        payment_terms: data.paymentTerms || undefined,
        notes: data.notes || undefined,
      });
      toast.success(t("supplierCreated"));
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  });

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
          onSubmit={onSubmit}
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
                {/* Name — required */}
                <Field data-invalid={!!form.formState.errors.name}>
                  <FieldLabel>
                    {t("name")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="supplier-name"
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
                        id="supplier-contact"
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
                        id="supplier-phone"
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
                      id="supplier-email"
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
                      id="supplier-address"
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
                        id="supplier-tax-id"
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
                        id="supplier-payment-terms"
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
                      id="supplier-notes"
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
