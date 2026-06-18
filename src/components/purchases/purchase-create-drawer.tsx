"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createPurchaseOrder } from "@/app/(dashboard)/purchases/actions";
import { buttonVariants } from "@/components/ui/button";
import { DrawerFooter, DrawerCancel, DrawerSubmit } from "@/components/ui/drawer-footer";
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
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import {
  VariantPicker,
  type SelectedVariant,
} from "@/components/products/variant-picker";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { ErrorBanner } from "@/components/ui/error-banner";
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
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [serverError, setServerError] = useState<string | null>(null);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [variantSelections, setVariantSelections] = useState<
    Record<number, SelectedVariant | null>
  >({});

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
      items: [{ product_id: "", quantity: 1, unit_cost: 0, variant_id: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const removeRow = useVariantLineItemRemove(remove, setVariantSelections);

  const items = watch("items");
  const totalAmount =
    items?.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_cost || 0),
      0,
    ) ?? 0;

  const trimmedSupplierQuery = supplierQuery.trim().toLowerCase();
  const filteredSuppliers = trimmedSupplierQuery
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(trimmedSupplierQuery),
      )
    : suppliers;

  const watchedSupplierId = watch("supplier_id");
  const selectedSupplier =
    suppliers.find((s) => s.id === watchedSupplierId) ?? null;

  const onSubmit = async (data: PurchaseValues) => {
    setServerError(null);
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

    try {
      const result = await createPurchaseOrder(undefined, formData);
      if (result?.error) {
        setServerError(result.error);
      } else if (result && "success" in result) {
        setOpen(false);
        reset();
        toast.success("Худалдан авалтын захиалга амжилттай үүсгэгдлээ.");
      }
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Захиалга үүсгэхэд алдаа гарлаа.",
      );
    }
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
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
        <DrawerFooter>
          <DrawerCancel onClick={() => { setOpen(false); reset(); }} />
          <DrawerSubmit form="purchase-form" isPending={isSubmitting} label="Захиалга үүсгэх" loadingLabel="Үүсгэж байна..." />
        </DrawerFooter>
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
              render={({ field }) => (
                <Combobox
                  items={filteredSuppliers}
                  value={suppliers.find((s) => s.id === field.value) ?? null}
                  onValueChange={(
                    next: { id: string; name: string } | null,
                  ) => {
                    field.onChange(next?.id ?? "");
                    setSupplierQuery("");
                  }}
                  itemToStringValue={(
                    c: { id: string; name: string } | null,
                  ) => c?.id ?? ""}
                  itemToStringLabel={(
                    c: { id: string; name: string } | null,
                  ) => c?.name ?? ""}
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
                      {(s: { id: string; name: string }) => (
                        <ComboboxItem key={s.id}>{s.name}</ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
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
                    value={
                      field.value ? new Date(field.value) : undefined
                    }
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
            <Field>
              <FieldLabel>
                Хүлээгдэж буй огноо
                <span className="text-xs text-muted-foreground">
                  {" "}
                  (заавал биш)
                </span>
              </FieldLabel>
              <Controller
                control={control}
                name="expected_date"
                render={({ field }) => (
                  <DatePicker
                    value={
                      field.value ? new Date(field.value) : undefined
                    }
                    onChange={(date) =>
                      field.onChange(date ? formatRouteDate(date) : "")
                    }
                    placeholder="Хүлээгдэж буй өдөр"
                  />
                )}
              />
            </Field>
          </div>
        </FieldGroup>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Бараанууд</span>
            <button
              type="button"
              onClick={() =>
                append({ product_id: "", quantity: 1, unit_cost: 0, variant_id: undefined })
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

          {fields.map((field, index) => {
            const selectedProduct = products.find(
              (p) => p.id === watch(`items.${index}.product_id`),
            );

            return (
              <div
                key={field.id}
                className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-[140px]">
                  <FieldLabel className="mb-1 text-xs">
                    Бүтээгдэхүүн
                  </FieldLabel>
                  <Controller
                    control={control}
                    name={`items.${index}.product_id` as const}
                    render={({ field: productField }) => (
                      <Combobox
                        items={products}
                        value={
                          products.find(
                            (p) => p.id === productField.value,
                          ) ?? null
                        }
                        onValueChange={(next: ProductOption | null) => {
                          productField.onChange(next?.id ?? "");
                          // Clear variant selection when product changes
                          setVariantSelections((prev) => ({
                            ...prev,
                            [index]: null,
                          }));
                          setValue(
                            `items.${index}.variant_id`,
                            undefined,
                          );
                          // Auto-fill unit_cost from product cost_price
                          if (next?.cost_price) {
                            setValue(
                              `items.${index}.unit_cost`,
                              next.cost_price,
                            );
                          } else {
                            setValue(
                              `items.${index}.unit_cost`,
                              0,
                            );
                          }
                        }}
                        itemToStringValue={(p: ProductOption | null) =>
                          p?.id ?? ""
                        }
                        itemToStringLabel={(p: ProductOption | null) =>
                          p?.name ?? ""
                        }
                        inputValue=""
                        onInputValueChange={() => {}}
                      >
                        <ComboboxInput
                          placeholder="Сонгох"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>
                            Бүтээгдэхүүн байхгүй
                          </ComboboxEmpty>
                          <ComboboxList>
                            {(p: ProductOption) => (
                              <ComboboxItem key={p.id} value={p}>
                                {p.name}
                                {p.current_stock != null &&
                                  ` (Үлд: ${p.current_stock} ${p.unit ?? "ширхэг"})`}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    )}
                  />
                  {selectedProduct && (
                    <div className="mt-1">
                      <VariantPicker
                        productId={selectedProduct.id}
                        onSelect={(variant) => {
                          setVariantSelections((prev) => ({
                            ...prev,
                            [index]: variant,
                          }));
                          if (variant) {
                            setValue(
                              `items.${index}.variant_id`,
                              variant.variant_id,
                            );
                          } else {
                            setValue(
                              `items.${index}.variant_id`,
                              undefined,
                            );
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="w-20">
                  <FieldLabel className="mb-1 text-xs">
                    Тоо хэмжээ
                  </FieldLabel>
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="w-28">
                  <FieldLabel className="mb-1 text-xs">Өртөг</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    {...register(`items.${index}.unit_cost`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="flex items-center gap-1 pb-1">
                  <span className="text-sm font-medium">
                    {formatCurrency(
                      (items?.[index]?.quantity ?? 0) *
                        (items?.[index]?.unit_cost ?? 0),
                    )}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="size-8 flex items-center justify-center text-destructive hover:bg-muted rounded"
                    >
                      <Trash className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t pt-3">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">
              Нийт дүн:
            </span>
            <span className="ml-2 text-lg font-semibold">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <Field>
          <FieldLabel>
            Тэмдэглэл{" "}
            <span className="text-xs text-muted-foreground">
              (заавал биш)
            </span>
          </FieldLabel>
          <Textarea
            placeholder="Нэмэлт тэмдэглэл..."
            {...register("notes")}
          />
        </Field>

        <ErrorBanner error={serverError} />
      </form>
    </SlideInDrawer>
  );
}
