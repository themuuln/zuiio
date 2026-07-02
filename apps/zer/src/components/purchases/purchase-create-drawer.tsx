"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createPurchaseOrder } from "@/app/(dashboard)/purchases/actions";
import type { SelectedVariant } from "@/components/products/variant-picker";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { purchaseKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  LineItemRow,
  computeLineItemsTotal,
} from "@/components/ui/line-item-row";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";

type SupplierOption = {
  id: string;
  name: string;
  phone: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

const lineItemSchema = z.object({
  product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_cost: z.number().min(0, "Өртөг 0-ээс багагүй"),
  variant_id: z.string().optional(),
});

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, "Нийлүүлэгч сонгоно уу"),
  order_date: z.string().min(1, "Огноо шаардлагатай"),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Дор хаяж нэг бараа оруулна уу"),
});

type PurchaseValues = z.infer<typeof purchaseSchema>;

export function PurchaseCreateDrawer({
  suppliers,
  products,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess,
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [supplierQuery, setSupplierQuery] = useState("");
  const [_variantSelections, setVariantSelections] = useState<
    Record<number, SelectedVariant | null>
  >({});

  const purchaseMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createPurchaseOrder(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: purchaseKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      order_number: `OPT-${Date.now()}`,
      order_date: formData.get("order_date")?.toString() ?? "",
      status: "draft",
      total_amount: 0,
      created_at: new Date().toISOString(),
      contacts: null,
    }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: "",
      order_date: new Date().toISOString().slice(0, 10),
      expected_date: "",
      notes: "",
      items: [
        { product_id: "", quantity: 1, unit_cost: 0, variant_id: undefined },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const removeRow = useVariantLineItemRemove(remove, setVariantSelections);

  const items = watch("items");
  const totalAmount = computeLineItemsTotal(items);

  const trimmedSupplierQuery = supplierQuery.trim().toLowerCase();
  const filteredSuppliers = trimmedSupplierQuery
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(trimmedSupplierQuery),
      )
    : suppliers;

  const watchedSupplierId = watch("supplier_id");
  const _selectedSupplier =
    suppliers.find((s) => s.id === watchedSupplierId) ?? null;

  // Auto-select supplier when only one is available
  useEffect(() => {
    if (filteredSuppliers.length === 1 && !watchedSupplierId) {
      setValue("supplier_id", filteredSuppliers[0].id);
      setSupplierQuery("");
    }
  }, [filteredSuppliers, watchedSupplierId, setValue]);

  const onSubmit = (data: PurchaseValues) => {
    if (purchaseMutation.isPending) return;
    const formData = new FormData();
    formData.append("supplier_id", data.supplier_id);
    formData.append("order_date", data.order_date);
    formData.append("expected_date", data.expected_date ?? "");
    formData.append("notes", data.notes ?? "");
    formData.append(
      "items",
      JSON.stringify(
        data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          variant_id: item.variant_id ?? null,
        })),
      ),
    );

    purchaseMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        onSuccess?.();
        toast.success("Худалдан авалтын захиалга амжилттай үүсгэгдлээ.");
      },
    });
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          setVariantSelections({});
        }
      }}
      title="Шинэ захиалга"
      description="Нийлүүлэгч, бараа, огнооны мэдээллийг оруулна уу."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <ShoppingCart className="size-4" />
          Шинэ захиалга
        </button>
      }
      panelWidth="32rem"
      footer={
        <>
          <div className="flex justify-end px-0 pb-2">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Нийт дүн:</span>
              <span className="ml-2 text-lg font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
          <DrawerFooter>
            <DrawerCancel
              onClick={() => {
                setOpen(false);
                reset();
              }}
            />
            <DrawerSubmit
              form="purchase-form"
              isPending={isSubmitting || purchaseMutation.isPending}
              label="Захиалга үүсгэх"
              loadingLabel="Үүсгэж байна..."
            />
          </DrawerFooter>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="purchase-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Нийлүүлэгч</FieldLabel>
            <Controller
              control={control}
              name="supplier_id"
              render={({ field }) => {
                const selectedSupplier = suppliers.find(
                  (s) => s.id === field.value,
                );
                // Ensure selected supplier is always in items list
                const itemsWithSelected =
                  selectedSupplier &&
                  !filteredSuppliers.some((s) => s.id === selectedSupplier.id)
                    ? [selectedSupplier, ...filteredSuppliers]
                    : filteredSuppliers;

                return (
                  <Combobox
                    items={itemsWithSelected}
                    value={selectedSupplier ?? null}
                    onValueChange={(next: SupplierOption | null) => {
                      field.onChange(next?.id ?? "");
                      setSupplierQuery("");
                    }}
                    itemToStringValue={(c: SupplierOption | null) =>
                      c?.id ?? ""
                    }
                    itemToStringLabel={(c: SupplierOption | null) =>
                      c?.name ?? ""
                    }
                    inputValue={supplierQuery}
                    onInputValueChange={setSupplierQuery}
                  >
                    <ComboboxInput
                      placeholder="Нийлүүлэгч сонгох"
                      showTrigger
                      className="w-full"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>Нийлүүлэгч байхгүй</ComboboxEmpty>
                      <ComboboxList>
                        {(s: SupplierOption) => (
                          <ComboboxItem key={s.id}>{s.name}</ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                );
              }}
            />
            {errors.supplier_id && (
              <p className="text-xs text-destructive">
                {errors.supplier_id.message}
              </p>
            )}
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Захиалгын огноо</FieldLabel>
              <Controller
                control={control}
                name="order_date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? formatRouteDate(date) : "")
                    }
                  />
                )}
              />
              {errors.order_date && (
                <p className="text-xs text-destructive">
                  {errors.order_date.message}
                </p>
              )}
            </Field>
          </div>
        </FieldGroup>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Бараанууд</span>
            <button
              type="button"
              onClick={() =>
                append({
                  product_id: "",
                  quantity: 1,
                  unit_cost: 0,
                  variant_id: undefined,
                })
              }
              className={buttonVariants({
                variant: "outline",
                size: "sm",
              })}
            >
              <ShoppingCart data-icon="inline-start" />
              Бараа нэмэх
            </button>
          </div>

          {fields.map((field, index) => (
            <LineItemRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              products={products}
              getProductId={(p) => p.id}
              getProductLabel={(p) => p.name}
              getProductStockLabel={(p) =>
                p.current_stock != null
                  ? `Үлд: ${p.current_stock} ${p.unit ?? "ширхэг"}`
                  : null
              }
              onProductSelect={(product, i) => {
                if (product?.cost_price) {
                  setValue(
                    `items.${i}.unit_cost`,
                    product.cost_price as number,
                  );
                } else {
                  setValue(`items.${i}.unit_cost`, 0);
                }
              }}
              variantSelections={_variantSelections}
              setVariantSelections={setVariantSelections}
              canRemove={fields.length > 1}
              onRemove={() => removeRow(index)}
              priceField="unit_cost"
              priceLabel="Өртөг"
            />
          ))}
        </div>

        <Field>
          <FieldLabel>
            Тэмдэглэл{" "}
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Textarea placeholder="Нэмэлт тэмдэглэл..." {...register("notes")} />
        </Field>

        <ErrorBanner error={purchaseMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
