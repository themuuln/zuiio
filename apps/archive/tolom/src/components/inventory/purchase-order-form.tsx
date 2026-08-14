"use client";

import { FileText, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useCreatePurchaseOrder,
  usePartsCatalog,
  useSuppliers,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import { formatMNT } from "@/lib/utils";

// ── Schema ───────────────────────────────────────────────────

const lineItemSchema = z.object({
  part_id: z.string().min(1, "Select a part"),
  quantity_ordered: z.number().min(1, "Quantity must be at least 1"),
  unit_cost: z.number().min(0, "Cost cannot be negative"),
});

const purchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(lineItemSchema)
    .min(1, "Add at least one item")
    .refine(
      (items) => items.every((i) => i.part_id.length > 0),
      "Select a part for all items",
    ),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

// ── Props ────────────────────────────────────────────────────

export type PurchaseOrderFormProps = {
  mode?: "quick" | "full";
  onSuccess?: (po: Record<string, unknown>) => void;
  onCancel?: () => void;
};

// ── Component ────────────────────────────────────────────────

export function PurchaseOrderForm({
  onSuccess,
  onCancel,
}: PurchaseOrderFormProps) {
  const t = useTranslations("inventory");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const suppliersQuery = useSuppliers(orgId);
  const partsQuery = usePartsCatalog(orgId);
  const suppliers = suppliersQuery.data ?? [];
  const parts = partsQuery.data ?? [];
  const isLoading =
    orgQuery.isPending || suppliersQuery.isLoading || partsQuery.isLoading;
  const createPO = useCreatePurchaseOrder(orgId);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      orderNumber: "",
      supplierId: "",
      notes: "",
      items: [],
    },
  });

  const {
    fields: itemFields,
    append: addItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity_ordered || 0) * (item.unit_cost || 0),
    0,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <FieldGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
        </FieldGroup>
        <Skeleton className="h-px w-full" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order Number — required */}
          <Field data-invalid={!!form.formState.errors.orderNumber}>
            <FieldLabel>
              {t("orderNumber")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="po-order-number"
                placeholder="PO-001"
                aria-invalid={!!form.formState.errors.orderNumber}
                {...form.register("orderNumber")}
              />
              {form.formState.errors.orderNumber && (
                <FieldError>
                  {form.formState.errors.orderNumber.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Supplier — optional */}
          <Field>
            <FieldLabel>{t("supplier")}</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("supplierId") || ""}
                onValueChange={(val) => form.setValue("supplierId", val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </div>

        {/* Notes — optional */}
        <Field>
          <FieldLabel>{t("notes")}</FieldLabel>
          <FieldContent>
            <Input
              id="po-notes"
              placeholder={t("notesPlaceholder")}
              {...form.register("notes")}
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      <Separator />

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Typography.H3 className="text-sm font-semibold">
            {t("items")}
          </Typography.H3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addItem({
                part_id: "",
                quantity_ordered: 1,
                unit_cost: 0,
              })
            }
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            {t("addItem")}
          </Button>
        </div>

        {form.formState.errors.items?.message && (
          <Typography.Text className="text-xs text-destructive mb-2">
            {form.formState.errors.items.message}
          </Typography.Text>
        )}

        {itemFields.length === 0 ? (
          <Typography.Muted className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
            {t("noItems")}
          </Typography.Muted>
        ) : (
          <div className="flex flex-col gap-2">
            {itemFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-end gap-2 p-2.5 rounded-lg border border-border/60 bg-card/40"
              >
                <div className="flex-1 min-w-0">
                  <Select
                    value={form.watch(`items.${index}.part_id`) || ""}
                    onValueChange={(val) =>
                      form.setValue(`items.${index}.part_id`, val ?? "")
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={
                        !!form.formState.errors.items?.[index]?.part_id
                      }
                    >
                      <SelectValue placeholder={t("selectPart")} />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.items?.[index]?.part_id && (
                    <Typography.Text className="text-xs text-destructive mt-1">
                      {form.formState.errors.items[index]?.part_id?.message}
                    </Typography.Text>
                  )}
                </div>
                <div className="w-20">
                  <NumericInput
                    min={1}
                    className="text-center"
                    value={form.watch(`items.${index}.quantity_ordered`) || 0}
                    onChange={(val) =>
                      form.setValue(`items.${index}.quantity_ordered`, val)
                    }
                  />
                </div>
                <div className="w-28">
                  <CurrencyInput
                    min={0}
                    className="text-right"
                    value={form.watch(`items.${index}.unit_cost`) || 0}
                    onChange={(val) =>
                      form.setValue(`items.${index}.unit_cost`, val)
                    }
                    showPrefix={false}
                  />
                </div>
                <div className="w-24 text-right text-sm tabular-nums pb-2">
                  {formatMNT(
                    (items[index]?.quantity_ordered || 0) *
                      (items[index]?.unit_cost || 0),
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-8 text-destructive shrink-0"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {itemFields.length > 0 && (
          <div className="flex justify-end text-base font-semibold mt-3 pt-3 border-t border-border">
            <span>
              {t("totalAmount")}: {formatMNT(totalAmount)}
            </span>
          </div>
        )}
      </div>

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
          disabled={createPO.isPending}
          className="h-11 px-6 min-w-[140px] gap-2 flex-1 sm:flex-none"
        >
          <FileText className="size-4" />
          {createPO.isPending ? t("saving") : t("create")}
        </Button>
      </div>
    </form>
  );

  async function onSubmit(data: PurchaseOrderFormValues) {
    try {
      const po = await createPO.mutateAsync({
        supplier_id: data.supplierId || undefined,
        order_number: data.orderNumber.trim(),
        notes: data.notes || undefined,
        items: data.items.map((i) => ({
          part_id: i.part_id,
          quantity_ordered: i.quantity_ordered,
          unit_cost: i.unit_cost,
        })),
      });
      form.reset({
        orderNumber: "",
        supplierId: "",
        notes: "",
        items: [],
      });
      onSuccess?.(po);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  }
}
