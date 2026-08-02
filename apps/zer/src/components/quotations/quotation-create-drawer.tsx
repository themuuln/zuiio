"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createQuotation } from "@/app/(dashboard)/quotations/actions";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  computeLineItemsTotal,
  LineItemRow,
} from "@/components/ui/line-item-row";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { quotationKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";

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
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [contactQuery, setContactQuery] = useState("");

  const quotationMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createQuotation(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: quotationKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      issue_date: formData.get("issue_date")?.toString() ?? "",
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

  const [variantSelections, setVariantSelections] = useState<
    Record<number, SelectedVariant | null>
  >({});

  const [productQueries, setProductQueries] = useState<string[]>([]);

  const removeRow = useVariantLineItemRemove(
    remove,
    setVariantSelections,
    setProductQueries,
  );

  const items = watch("items");
  const totalAmount = computeLineItemsTotal(items);

  const onSubmit = (data: QuotationValues) => {
    if (quotationMutation.isPending) return;
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
    quotationMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Үнийн санал амжилттай үүсгэгдлээ.");
      },
    });
  };

  const trimmedQuery = contactQuery.trim().toLowerCase();
  const filteredContacts = trimmedQuery
    ? customers.filter((c) => c.name.toLowerCase().includes(trimmedQuery))
    : customers;

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
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="quotation-form"
            isPending={isSubmitting || quotationMutation.isPending}
            label="Үнийн санал үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="quotation-form"
      >
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
              onValueChange={(next: { id: string; name: string } | null) => {
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
                append({
                  description: "",
                  quantity: 1,
                  unit_price: 0,
                  variant_id: undefined,
                })
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
              onProductSelect={(product, i) => {
                if (product) {
                  setValue(`items.${i}.unit_price`, product.sale_price ?? 0);
                }
              }}
              onVariantSelect={(variant, i) => {
                if (variant) {
                  setValue(`items.${i}.unit_price`, variant.sale_price ?? 0);
                } else {
                  const product = products.find(
                    (p) => p.id === watch(`items.${i}.product_id`),
                  );
                  setValue(`items.${i}.unit_price`, product?.sale_price ?? 0);
                }
              }}
              variantSelections={variantSelections}
              setVariantSelections={setVariantSelections}
              canRemove={fields.length > 1}
              onRemove={() => removeRow(index)}
              showDescription
              productQueries={productQueries}
              setProductQueries={setProductQueries}
            />
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
            <span className="text-xs text-muted-foreground">(заавал биш)</span>
          </FieldLabel>
          <Textarea placeholder="Нэмэлт тэмдэглэл..." {...register("notes")} />
        </Field>

        <ErrorBanner error={quotationMutation.error} />
      </form>
    </SlideInDrawer>
  );
}
