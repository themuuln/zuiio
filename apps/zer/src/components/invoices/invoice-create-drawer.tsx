"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createInvoice } from "@/app/(dashboard)/invoices/actions";
import type { SelectedVariant } from "@/components/products/variant-picker";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  LineItemRow,
  computeLineItemsTotal,
} from "@/components/ui/line-item-row";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";
import { invoiceKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

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
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const invoiceMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createInvoice(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: invoiceKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      invoice_number: `OPT-${Date.now()}`,
      issue_date: formData.get("issue_date")?.toString() ?? "",
      status: "pending",
      total_amount: 0,
      created_at: new Date().toISOString(),
      contacts: null,
    }),
  });
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
  const totalAmount = computeLineItemsTotal(items);

  const onSubmit = (data: InvoiceValues) => {
    if (invoiceMutation.isPending) return;
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
    invoiceMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Нэхэмжлэл амжилттай үүсгэгдлээ.");
      },
    });
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
      title="Шинэ нэхэмжлэл"
      description="Харилцагч, огноо, барааны мэдээллийг оруулна уу."
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="invoice-form"
            isPending={isSubmitting || invoiceMutation.isPending}
            label="Нэхэмжлэл үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form id="invoice-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5">
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
                    setValue(`items.${i}.description`, product.name);
                    setValue(
                      `items.${i}.unit_price`,
                      (product as any).sale_price ?? 0,
                    );
                  }
                }}
                onVariantSelect={(variant, i) => {
                  if (variant) {
                    setValue(`items.${i}.unit_price`, variant.sale_price ?? 0);
                  } else {
                    const prod = products.find(
                      (p) => p.id === watch(`items.${i}.product_id`),
                    );
                    setValue(`items.${i}.unit_price`, prod?.sale_price ?? 0);
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

        <ErrorBanner error={invoiceMutation.error} />
      </form>
    </DrawerLayout>
  );
}
