"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createQuotation } from "@/app/(dashboard)/quotations/actions";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import {
  VariantPicker,
  type SelectedVariant,
} from "@/components/products/variant-picker";
import { formatCurrency, formatRouteDate } from "@/lib/format";

const lineItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  description: z.string().min(1, "Тайлбар шаардлагатай"),
  quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_price: z.number().min(0, "Үнэ 0-ээс багагүй"),
  variant_id: z.string().optional(),
});

const quotationSchema = z.object({
  contact_id: z.string().optional(),
  issue_date: z.string().min(1, "Огноо шаардлагатай"),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Дор хаяж нэг бараа оруулна уу"),
});

type QuotationValues = z.infer<typeof quotationSchema>;

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
};

export function QuotationCreateDrawer({
  customers,
  products,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [contactQuery, setContactQuery] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      issue_date: new Date().toISOString().slice(0, 10),
      expiry_date: "",
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const totalAmount =
    items?.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0,
    ) ?? 0;

  const onSubmit = async (data: QuotationValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("contact_id", data.contact_id ?? "");
    formData.append("issue_date", data.issue_date);
    formData.append("expiry_date", data.expiry_date ?? "");
    formData.append("notes", data.notes ?? "");
    formData.append(
      "items",
      JSON.stringify(
        data.items.map((item) => ({
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          variant_id: item.variant_id ?? null,
        })),
      ),
    );
    const result = await createQuotation(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setOpen(false);
      reset();
    }
  };

  const trimmedQuery = contactQuery.trim().toLowerCase();
  const filteredContacts = trimmedQuery
    ? customers.filter((c) => c.name.toLowerCase().includes(trimmedQuery))
    : customers;

  // Product combobox helpers for items
  const [productQueries, setProductQueries] = useState<
    Record<number, string>
  >({});
  const [variantSelections, setVariantSelections] = useState<
    Record<number, SelectedVariant | null>
  >({});

  const setProductQuery = (index: number, query: string) => {
    setProductQueries((prev) => ({ ...prev, [index]: query }));
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
      title="Шинэ үнийн санал"
      description="Харилцагч, огноо, барааны мэдээллийг оруулна уу."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          <Plus className="size-4" />
          Шинэ үнийн санал
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Contact and Dates */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>
              Үйлчлүүлэгч{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <input type="hidden" {...register("contact_id")} />
            <Combobox
              items={filteredContacts}
              value={selectedContact}
              onValueChange={(
                next: { id: string; name: string } | null,
              ) => {
                setSelectedContact(next);
                setContactQuery("");
              }}
              itemToStringValue={(c: { id: string; name: string } | null) =>
                c?.id ?? ""
              }
              itemToStringLabel={(c: { id: string; name: string } | null) =>
                c?.name ?? ""
              }
              inputValue={contactQuery}
              onInputValueChange={setContactQuery}
            >
              <ComboboxInput
                placeholder="Харилцагч сонгох"
                showTrigger
                className="w-full"
              />
              <ComboboxContent>
                <ComboboxEmpty>Харилцагч байхгүй</ComboboxEmpty>
                <ComboboxList>
                  {(c: { id: string; name: string }) => (
                    <ComboboxItem key={c.id}>{c.name}</ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel>Саналын огноо</FieldLabel>
            <Controller
              control={control}
              name="issue_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? formatRouteDate(date) : "")
                  }
                />
              )}
            />
            {errors.issue_date && (
              <p className="text-xs text-destructive">
                {errors.issue_date.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              Хүчинтэй хугацаа{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Controller
              control={control}
              name="expiry_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? formatRouteDate(date) : "")
                  }
                  placeholder="Хүчинтэй огноо"
                />
              )}
            />
          </Field>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Бараанууд</span>
            <button
              type="button"
              onClick={() =>
                append({ description: "", quantity: 1, unit_price: 0, variant_id: undefined })
              }
              className={buttonVariants({
                variant: "outline",
                size: "sm",
              })}
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
                <Controller
                  control={control}
                  name={`items.${index}.product_id`}
                  render={({ field: productField }) => (
                    <Combobox
                      items={products}
                      value={
                        products.find((p) => p.id === productField.value) ??
                        null
                      }
                      onValueChange={(
                        next: ProductOption | null,
                      ) => {
                        productField.onChange(next?.id ?? null);
                        // Clear variant selection when product changes
                        setVariantSelections((prev) => ({
                          ...prev,
                          [index]: null,
                        }));
                        setValue(
                          `items.${index}.variant_id`,
                          undefined,
                        );
                        // Auto-fill unit_price from product
                        if (next) {
                          setValue(
                            `items.${index}.unit_price`,
                            next.sale_price ?? 0,
                          );
                        }
                        setProductQuery(index, "");
                      }}
                      itemToStringValue={(p: ProductOption | null) =>
                        p?.id ?? ""
                      }
                      itemToStringLabel={(p: ProductOption | null) =>
                        p?.name ?? ""
                      }
                      inputValue={productQueries[index] ?? ""}
                      onInputValueChange={(v) =>
                        setProductQuery(index, v)
                      }
                    >
                      <ComboboxInput
                        placeholder="Сонгох"
                        showTrigger
                        className="w-full"
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>Бараа байхгүй</ComboboxEmpty>
                        <ComboboxList>
                          {(p: ProductOption) => (
                            <ComboboxItem key={p.id}>
                              {p.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
                {products.find(
                  (p) => p.id === watch(`items.${index}.product_id`),
                ) && (
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
              <div className="flex-1 min-w-[140px]">
                <FieldLabel className="mb-1 text-xs">Тайлбар</FieldLabel>
                <Input
                  placeholder="Бүтээгдэхүүний нэр"
                  {...register(`items.${index}.description`)}
                />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-destructive">
                    {errors.items[index]?.description?.message}
                  </p>
                )}
              </div>
              <div className="w-20">
                <FieldLabel className="mb-1 text-xs">Тоо</FieldLabel>
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
                <FieldLabel className="mb-1 text-xs">Нэгж үнэ</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  {...register(`items.${index}.unit_price`, {
                    valueAsNumber: true,
                  })}
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
                    onClick={() => {
                      remove(index);
                      setVariantSelections((prev) => {
                        const next = { ...prev };
                        delete next[index];
                        const shifted: Record<number, SelectedVariant | null> = {};
                        for (const [key, value] of Object.entries(next)) {
                          const k = Number(key);
                          shifted[k > index ? k - 1 : k] = value;
                        }
                        return shifted;
                      });
                    }}
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

        {/* Notes */}
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

        {serverError && (
          <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={buttonVariants({ variant: "outline" })}
          >
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={buttonVariants({ variant: "default" })}
          >
            {isSubmitting ? "Үүсгэж байна..." : "Үнийн санал үүсгэх"}
          </button>
        </div>
      </form>
    </SlideInDrawer>
  );
}
