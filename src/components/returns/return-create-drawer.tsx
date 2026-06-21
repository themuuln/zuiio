"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUUpLeft, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createReturn } from "@/app/(dashboard)/returns/actions";
import {
  type SelectedVariant,
  VariantPicker,
} from "@/components/products/variant-picker";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";

const lineItemSchema = z.object({
  product_id: z.string().min(1, "Бараа сонгоно уу"),
  quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_price: z.number().min(0, "Үнэ 0-ээс багагүй"),
  reason: z.string().optional(),
  variant_id: z.string().optional(),
});

const returnSchema = z.object({
  type: z.enum(["sales_return", "purchase_return"]),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(),
  contact_id: z.string().optional(),
  return_date: z.string().min(1, "Огноо шаардлагатай"),
  reason: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Дор хаяж нэг бараа оруулна уу"),
});

type ReturnValues = z.infer<typeof returnSchema>;

type ContactOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type SaleOption = {
  id: string;
  sale_date: string;
  total_amount: number;
  contacts: { name: string } | null;
};

type PurchaseOrderOption = {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  contacts: { name: string } | null;
};

export function ReturnCreateDrawer({
  contacts,
  products,
  sales,
  purchaseOrders,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  contacts: ContactOption[];
  products: ProductOption[];
  sales: SaleOption[];
  purchaseOrders: PurchaseOrderOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [serverError, setServerError] = useState<string | null>(null);
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
  } = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      type: "sales_return",
      reference_type: "",
      reference_id: "",
      contact_id: "",
      return_date: new Date().toISOString().slice(0, 10),
      reason: "",
      items: [
        {
          product_id: "",
          quantity: 1,
          unit_price: 0,
          reason: "",
          variant_id: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const removeRow = useVariantLineItemRemove(remove, setVariantSelections);

  const watchedType = watch("type");
  const items = watch("items");

  const totalAmount =
    items?.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0,
    ) ?? 0;

  const referenceLabel =
    watchedType === "sales_return" ? "Борлуулалт" : "Худалдан авалтын захиалга";

  const onSubmit = async (data: ReturnValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("type", data.type);
    if (data.reference_type)
      formData.append("reference_type", data.reference_type);
    if (data.reference_id) formData.append("reference_id", data.reference_id);
    if (data.contact_id) formData.append("contact_id", data.contact_id);
    formData.append("return_date", data.return_date);
    if (data.reason) formData.append("reason", data.reason);
    formData.append(
      "items",
      JSON.stringify(
        data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          reason: item.reason || null,
          variant_id: item.variant_id ?? null,
        })),
      ),
    );
    const result = await createReturn(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setOpen(false);
      reset();
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
      title="Шинэ буцаалт"
      description="Буцаалтын төрөл, лавлагаа, барааны мэдээллийг оруулна уу."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          <ArrowUUpLeft data-icon="inline-start" />
          Шинэ буцаалт
        </button>
      }
      panelWidth="32rem"
      footer={
        <DrawerFooter>
          <DrawerCancel
            onClick={() => {
              setOpen(false);
              setServerError(null);
              reset();
            }}
          />
          <DrawerSubmit
            form="return-form"
            isPending={isSubmitting}
            label="Буцаалт үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="return-form"
      >
        <FieldGroup>
          {/* Type selection */}
          <Field>
            <FieldLabel>Буцаалтын төрөл</FieldLabel>
            <NativeSelect {...register("type")}>
              <option value="sales_return">Борлуулалтын буцаалт</option>
              <option value="purchase_return">Худалдан авалтын буцаалт</option>
            </NativeSelect>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </Field>

          {/* Reference selection */}
          {watchedType === "sales_return" && (
            <Field>
              <FieldLabel>{referenceLabel}</FieldLabel>
              <input
                type="hidden"
                {...register("reference_type")}
                value="sale"
              />
              <NativeSelect {...register("reference_id")}>
                <option value="">Сонгох...</option>
                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {new Date(sale.sale_date).toLocaleDateString()} -{" "}
                    {formatCurrency(sale.total_amount)} -{" "}
                    {sale.contacts?.name ?? "Unknown"}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}

          {watchedType === "purchase_return" && (
            <Field>
              <FieldLabel>{referenceLabel}</FieldLabel>
              <input
                type="hidden"
                {...register("reference_type")}
                value="purchase_order"
              />
              <NativeSelect {...register("reference_id")}>
                <option value="">Сонгох...</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.order_number} - {formatCurrency(po.total_amount)} -{" "}
                    {po.contacts?.name ?? "Unknown"}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}

          {/* Contact */}
          <Field>
            <FieldLabel>
              Харилцагч{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <NativeSelect {...register("contact_id")}>
              <option value="">Сонгох...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Return date */}
          <Field>
            <FieldLabel>Буцаалтын огноо</FieldLabel>
            <Controller
              control={control}
              name="return_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? formatRouteDate(date) : "")
                  }
                />
              )}
            />
            {errors.return_date && (
              <p className="text-xs text-destructive">
                {errors.return_date.message}
              </p>
            )}
          </Field>

          {/* Reason */}
          <Field>
            <FieldLabel>
              Шалтгаан{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Input
              placeholder="Буцаалтын шалтгаан..."
              {...register("reason")}
            />
          </Field>
        </FieldGroup>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Бараанууд</span>
            <button
              type="button"
              onClick={() =>
                append({
                  product_id: "",
                  quantity: 1,
                  unit_price: 0,
                  reason: "",
                  variant_id: undefined,
                })
              }
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Plus data-icon="inline-start" />
              Бараа нэмэх
            </button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
            >
              <div className="flex-1 min-w-[140px]">
                <FieldLabel className="mb-1 text-xs">Бараа</FieldLabel>
                <NativeSelect {...register(`items.${index}.product_id`)}>
                  <option value="">Сонгох...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </NativeSelect>
                {watch(`items.${index}.product_id`) && (
                  <div className="mt-1">
                    <VariantPicker
                      productId={watch(`items.${index}.product_id`)!}
                      onSelect={(variant) => {
                        setVariantSelections((prev) => ({
                          ...prev,
                          [index]: variant,
                        }));
                        if (variant) {
                          setValue(
                            `items.${index}.unit_price`,
                            variant.sale_price ?? 0,
                          );
                          setValue(
                            `items.${index}.variant_id`,
                            variant.variant_id,
                          );
                        } else {
                          const product = products.find(
                            (p) => p.id === watch(`items.${index}.product_id`),
                          );
                          setValue(
                            `items.${index}.unit_price`,
                            product?.sale_price ?? 0,
                          );
                          setValue(`items.${index}.variant_id`, undefined);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="w-20">
                <FieldLabel className="mb-1 text-xs">Тоо</FieldLabel>
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="1"
                  {...register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="w-28">
                <FieldLabel className="mb-1 text-xs">Нэгж үнэ</FieldLabel>
                <Controller
                  control={control}
                  name={`items.${index}.unit_price`}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center gap-1 pb-1">
                <span className="text-sm font-medium">
                  {formatCurrency(
                    (items?.[index]?.quantity ?? 0) *
                      (items?.[index]?.unit_price ?? 0),
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
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end border-t pt-3">
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Нийт дүн:</span>
            <span className="ml-2 text-lg font-semibold">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* Items error */}
        {errors.items && !Array.isArray(errors.items) && (
          <p className="text-xs text-destructive">{errors.items.message}</p>
        )}

        {/* Server error */}
        <ErrorBanner error={serverError} />
      </form>
    </SlideInDrawer>
  );
}
