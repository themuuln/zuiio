"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createInvoice } from "@/app/(dashboard)/invoices/actions";
import {
  type SelectedVariant,
  VariantPicker,
} from "@/components/products/variant-picker";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

const lineItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  description: z.string().min(1, "Тайлбар шаардлагатай"),
  quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_price: z.number().min(0, "Үнэ 0-ээс багагүй"),
  variant_id: z.string().optional(),
});

const invoiceSchema = z.object({
  contact_id: z.string().optional(),
  new_contact_name: z.string().optional(),
  issue_date: z.string().min(1, "Огноо шаардлагатай"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Дор хаяж нэг бараа оруулна уу"),
});

type InvoiceValues = z.infer<typeof invoiceSchema>;

export function InvoiceCreateDrawer({
  contacts: initialContacts,
  products,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  contacts: Array<{ id: string; name: string }>;
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
  const [variantSelections, setVariantSelections] = useState<
    Record<number, SelectedVariant | null>
  >({});
  const [productQueries, setProductQueries] = useState<string[]>([""]);
  const [contacts, setContacts] = useState(initialContacts);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const removeRow = useVariantLineItemRemove(
    remove,
    setVariantSelections,
    setProductQueries,
  );

  const items = watch("items");
  const totalAmount =
    items?.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0,
    ) ?? 0;

  const onSubmit = async (data: InvoiceValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("contact_id", data.contact_id ?? "");
    formData.append("issue_date", data.issue_date);
    formData.append("due_date", data.due_date ?? "");
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
    const result = await createInvoice(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    }
  };

  const trimmedQuery = contactQuery.trim().toLowerCase();
  const filteredContacts = trimmedQuery
    ? contacts.filter((c) => c.name.toLowerCase().includes(trimmedQuery))
    : contacts;

  return (
    <DrawerLayout
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
          reset();
          setVariantSelections({});
          setProductQueries([""]);
        }
      }}
      panelWidth="36rem"
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          <FileText data-icon="inline-start" />
          Шинэ нэхэмжлэл
        </button>
      }
    >
      <DrawerHeader
        title="Шинэ нэхэмжлэл"
        description="Харилцагч, огноо, барааны мэдээллийг оруулна уу."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 min-h-0 space-y-5"
      >
        <div className="flex-1 overflow-y-auto space-y-5">
          <FieldGroup>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Огноо</FieldLabel>
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
                  Дуусах хугацаа{" "}
                  <span className="text-xs text-muted-foreground">
                    (заавал биш)
                  </span>
                </FieldLabel>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) =>
                        field.onChange(date ? formatRouteDate(date) : "")
                      }
                      placeholder="Дуусах өдөр"
                    />
                  )}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>
                Харилцагч{" "}
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
                onCreate={async (label: string) => {
                  const supabase = createClient();
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("organization_id")
                    .eq("id", user.id)
                    .single();
                  if (!profile?.organization_id) return;

                  const { data: newContact, error } = await supabase
                    .from("contacts")
                    .insert({
                      organization_id: profile.organization_id,
                      type: "customer",
                      name: label,
                    })
                    .select("id, name")
                    .single();

                  if (error || !newContact) return;

                  setContacts((prev) => [...prev, newContact]);
                  setSelectedContact(newContact);
                  setContactQuery("");
                }}
              >
                <ComboboxInput
                  placeholder="Харилцагч сонгох"
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxCreate />
                  <ComboboxEmpty>Харилцагч байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(c: { id: string; name: string }) => (
                      <ComboboxItem key={c.id}>{c.name}</ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
          </FieldGroup>

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
              <div
                key={field.id}
                className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-[140px]">
                  <FieldLabel className="mb-1 text-xs">Бүтээгдэхүүн</FieldLabel>
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
                        onValueChange={(next: ProductOption | null) => {
                          productField.onChange(next?.id ?? null);
                          setVariantSelections((prev) => ({
                            ...prev,
                            [index]: null,
                          }));
                          setValue(`items.${index}.variant_id`, undefined);
                          if (next) {
                            setValue(`items.${index}.description`, next.name);
                            setValue(
                              `items.${index}.unit_price`,
                              next.sale_price ?? 0,
                            );
                          }
                          setProductQueries((prev) => {
                            const next_q = [...prev];
                            next_q[index] = "";
                            return next_q;
                          });
                        }}
                        itemToStringValue={(p: ProductOption | null) =>
                          p?.id ?? ""
                        }
                        itemToStringLabel={(p: ProductOption | null) =>
                          p?.name ?? ""
                        }
                        inputValue={productQueries[index] ?? ""}
                        onInputValueChange={(v) =>
                          setProductQueries((prev) => {
                            const next_q = [...prev];
                            next_q[index] = v;
                            return next_q;
                          })
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
                              <ComboboxItem key={p.id}>{p.name}</ComboboxItem>
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
                            const prod = products.find(
                              (p) =>
                                p.id === watch(`items.${index}.product_id`),
                            );
                            setValue(
                              `items.${index}.unit_price`,
                              prod?.sale_price ?? 0,
                            );
                            setValue(`items.${index}.variant_id`, undefined);
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

          <div className="flex justify-end border-t pt-3">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Нийт дүн:</span>
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
        </div>

        <ErrorBanner error={serverError} />

        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            isPending={isSubmitting}
            label="Нэхэмжлэл үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      </form>
    </DrawerLayout>
  );
}
