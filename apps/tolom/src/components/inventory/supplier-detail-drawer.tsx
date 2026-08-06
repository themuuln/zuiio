"use client";

import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useRemoveSupplierPart,
  useSupplierParts,
  useSuppliers,
  useUpdateSupplier,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import { SupplierAddPartDrawer } from "./supplier-add-part-drawer";

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

export function SupplierDetailDrawer({
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
  const { data: supplierParts = [], isLoading: partsLoading } =
    useSupplierParts(orgId, supplierId ?? undefined);
  const removeSupplierPart = useRemoveSupplierPart(orgId);
  const [showAddPart, setShowAddPart] = useState(false);

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
      toast.dismiss();
      toast.success(t("supplierUpdated"));
      handleOpenChange(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
    }
  });

  const isLoading = suppliersLoading && open;
  const notFound = open && !suppliersLoading && !supplier;

  return (
    <>
      <DetailDrawer open={open} onOpenChange={handleOpenChange}>
        <DetailDrawer.Header>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Pencil className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DetailDrawer.Title>{t("editSupplier")}</DetailDrawer.Title>
              <DetailDrawer.Description>
                {supplier?.name ?? "..."}
              </DetailDrawer.Description>
            </div>
          </div>
        </DetailDrawer.Header>

        <DetailDrawer.Body>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
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
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Typography.Muted className="text-muted-foreground">
                {t("supplierNotFound")}
              </Typography.Muted>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("cancel")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <form id="supplier-detail-drawer-form" onSubmit={onSubmit}>
                <FieldGroup>
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
              </form>

              {/* ── Supplier Parts Section ── */}
              <div className="flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {t("supplierParts")}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPart(true)}
                  >
                    <Plus className="mr-1 size-4" />
                    {t("supplierAddPart")}
                  </Button>
                </div>

                {partsLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : supplierParts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                    <Package className="size-8 text-muted-foreground/40" />
                    <p className="text-sm">{t("noSupplierParts")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border rounded-lg border border-input">
                    {supplierParts.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              {sp.part?.name ?? "—"}
                            </span>
                            {sp.is_preferred && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                Preferred
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {sp.part?.part_number && (
                              <span>#{sp.part.part_number}</span>
                            )}
                            {sp.supplier_part_number && (
                              <span>Sup#: {sp.supplier_part_number}</span>
                            )}
                            {sp.unit_cost != null && (
                              <span>
                                ₮{Number(sp.unit_cost).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={async () => {
                            if (!confirm(t("confirmRemoveSupplierPart")))
                              return;
                            try {
                              await removeSupplierPart.mutateAsync({
                                supplierId: supplierId as string,
                                id: sp.id,
                              });
                              toast.success(t("supplierPartRemoved"));
                            } catch (err) {
                              reportServerError(
                                "Failed to remove supplier part",
                                err,
                              );
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : t("failedToRemove"),
                              );
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DetailDrawer.Body>

        {!isLoading && !notFound && (
          <DetailDrawer.Footer>
            <DetailDrawer.FooterActions>
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
                form="supplier-detail-drawer-form"
                className="flex-1 gap-2"
                size="lg"
                disabled={updateSupplier.isPending}
              >
                {updateSupplier.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pencil className="size-4" />
                )}
                {updateSupplier.isPending ? t("saving") : t("save")}
              </Button>
            </DetailDrawer.FooterActions>
          </DetailDrawer.Footer>
        )}
      </DetailDrawer>

      <SupplierAddPartDrawer
        open={showAddPart}
        onOpenChange={setShowAddPart}
        supplierId={supplierId as string}
      />
    </>
  );
}
