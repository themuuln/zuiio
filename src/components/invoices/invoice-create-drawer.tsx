"use client";

import { Drawer } from "@base-ui/react/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus, Trash, X } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createInvoice } from "@/app/(dashboard)/invoices/actions";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const lineItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  description: z.string().min(1, "Тайлбар шаардлагатай"),
  quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_price: z.number().min(0, "Үнэ 0-ээс багагүй"),
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
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  contacts: Array<{ id: string; name: string }>;
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
  const [contacts, setContacts] = useState(initialContacts);

  const {
    register,
    handleSubmit,
    control,
    watch,
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
    <Drawer.Root
      swipeDirection="right"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
          reset();
        }
      }}
    >
      <Drawer.Trigger
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        <FileText data-icon="inline-start" />
        Шинэ нэхэмжлэл
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] z-40 [--bleed:3rem] dark:[--backdrop-opacity:0.4] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] z-50 supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(36rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[36rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Шинэ нэхэмжлэл
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    Харилцагч, огноо, барааны мэдээллийг оруулна уу.
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FieldGroup>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Огноо</FieldLabel>
                      <Controller
                        control={control}
                        name="issue_date"
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
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
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
                      onValueChange={(
                        next: { id: string; name: string } | null,
                      ) => {
                        setSelectedContact(next);
                        setContactQuery("");
                      }}
                      itemToStringValue={(
                        c: { id: string; name: string } | null,
                      ) => c?.id ?? ""}
                      itemToStringLabel={(
                        c: { id: string; name: string } | null,
                      ) => c?.name ?? ""}
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
                        append({ description: "", quantity: 1, unit_price: 0 })
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
                        <FieldLabel className="mb-1 text-xs">
                          Тайлбар
                        </FieldLabel>
                        <Input
                          placeholder="Бүтээгдэхүүний нэр"
                          {...register(`items.${index}.description`)}
                        />
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
                        <FieldLabel className="mb-1 text-xs">
                          Нэгж үнэ
                        </FieldLabel>
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
                            onClick={() => remove(index)}
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

                {serverError && (
                  <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Drawer.Close
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Цуцлах
                  </Drawer.Close>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={buttonVariants({ variant: "default" })}
                  >
                    {isSubmitting ? "Үүсгэж байна..." : "Нэхэмжлэл үүсгэх"}
                  </button>
                </div>
              </form>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
