"use client";

import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCreateSupplier } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { emailSchema, phoneSchema } from "@/lib/validation/schemas";

// ── Schema ───────────────────────────────────────────────────
// Use shared validators for phone/email patterns. No supplier-specific
// schema module exists yet — inline the domain-specific fields.

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema,
  address: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

// ── Props ────────────────────────────────────────────────────

export type SupplierFormProps = {
  mode?: "quick" | "full";
  onSuccess?: (supplier: any) => void;
  onCancel?: () => void;
};

// ── Component ────────────────────────────────────────────────

export function SupplierForm({ onSuccess, onCancel }: SupplierFormProps) {
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

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const supplier = await createSupplier.mutateAsync({
        name: data.name.trim(),
        contact_person: data.contactPerson || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        tax_id: data.taxId || undefined,
        payment_terms: data.paymentTerms || undefined,
        notes: data.notes || undefined,
      });
      form.reset();
      onSuccess?.(supplier);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  });

  if (orgQuery.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
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
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-9 w-full" />
        </div>
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
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
              <FieldError>{form.formState.errors.name.message}</FieldError>
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="h-11 px-6 flex-1 sm:flex-none"
          >
            {t("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={createSupplier.isPending}
          className="h-11 px-6 min-w-[140px] gap-2 flex-1 sm:flex-none"
        >
          <Truck className="size-4" />
          {createSupplier.isPending ? t("saving") : t("create")}
        </Button>
      </div>
    </form>
  );
}
