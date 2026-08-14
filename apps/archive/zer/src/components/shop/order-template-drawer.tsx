"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  ListChecks,
  PencilSimple,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { OrderTemplateListItem } from "@/app/(dashboard)/shop/templates/actions";
import {
  createOrderTemplate,
  deleteOrderTemplate,
  getOrderTemplate,
  listOrderTemplates,
  loadTemplateIntoCart,
  updateOrderTemplate,
} from "@/app/(dashboard)/shop/templates/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { orderTemplateKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import type { CartItem } from "@/lib/shop-cart";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const templateItemSchema = z.object({
  product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  variant_id: z.string().optional(),
  quantity: z.number().min(1, "Тоо хэмжээ хамгийн багадаа 1"),
});

const templateSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  contact_id: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(templateItemSchema)
    .min(1, "Дор хаяж нэг бүтээгдэхүүн оруулна уу"),
});

type TemplateValues = z.infer<typeof templateSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductOption = {
  id: string;
  name: string;
  current_stock: number | null;
  unit: string | null;
  sale_price: number | null;
};

type CustomerOption = {
  id: string;
  name: string;
};

type DrawerView = "list" | "create" | "edit";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderTemplateDrawer({
  customers,
  products,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onLoadIntoCart,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onLoadIntoCart?: (items: CartItem[], warnings: string[]) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const [view, setView] = useState<DrawerView>("list");
  const [templates, setTemplates] = useState<OrderTemplateListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<OrderTemplateListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Combobox search state
  const [contactQuery, setContactQuery] = useState("");
  const [productQueries, setProductQueries] = useState<string[]>([""]);

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      contact_id: "",
      notes: "",
      items: [{ product_id: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createOrderTemplate(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: orderTemplateKeys.all,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- library type mismatch
    buildOptimistic: (formData: FormData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      notes: null,
      is_active: true,
      contact_id: null,
      contact_name: null,
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  // ---------------------------------------------------------------------------
  // Fetch templates
  // ---------------------------------------------------------------------------

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    const result = await listOrderTemplates();
    if ("error" in result) {
      setActionError(result.error);
    } else {
      setTemplates(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && view === "list") {
      fetchTemplates();
    }
  }, [open, view, fetchTemplates]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCreate = () => {
    setView("create");
    setEditingTemplate(null);
    setActionError(null);
    setContactQuery("");
    setProductQueries([""]);
    reset({
      name: "",
      contact_id: "",
      notes: "",
      items: [{ product_id: "", quantity: 1 }],
    });
  };

  const handleEdit = async (template: OrderTemplateListItem) => {
    setEditingTemplate(template);
    setView("edit");
    setActionError(null);
    setContactQuery(template.contact_name ?? "");

    const result = await getOrderTemplate(template.id);
    if ("error" in result) {
      setActionError(result.error);
      return;
    }

    const detail = result.data;
    const formItems =
      detail.items.length > 0
        ? detail.items.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id ?? undefined,
            quantity: i.quantity,
          }))
        : [{ product_id: "", quantity: 1 }];

    setProductQueries(formItems.map(() => ""));
    reset({
      name: detail.name,
      contact_id: detail.contact_id ?? "",
      notes: detail.notes ?? "",
      items: formItems,
    });
  };

  const handleDelete = async (templateId: string) => {
    setDeletingId(templateId);
    const result = await deleteOrderTemplate(templateId);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Загвар амжилттай устгагдлаа.");
      fetchTemplates();
    }
    setDeletingId(null);
  };

  const handleLoadIntoCart = async (templateId: string) => {
    const result = await loadTemplateIntoCart(templateId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    if (result.items.length === 0) {
      toast.warning("Загварт ачаалах боломжтой бүтээгдэхүүн байхгүй.");
      for (const w of result.warnings) {
        toast.warning(w);
      }
      return;
    }
    for (const w of result.warnings) {
      toast.warning(w);
    }
    onLoadIntoCart?.(result.items, result.warnings);
    toast.success(`${result.items.length} бүтээгдэхүүн сагсанд нэмэгдлээ.`);
    setOpen(false);
  };

  const onSubmit = async (data: TemplateValues) => {
    setActionError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("contact_id", data.contact_id ?? "");
    formData.append("notes", data.notes ?? "");
    formData.append(
      "items",
      JSON.stringify(
        data.items.map((item) => ({
          productId: item.product_id,
          variantId: item.variant_id ?? null,
          quantity: item.quantity,
        })),
      ),
    );

    if (view === "edit" && editingTemplate) {
      const result = await updateOrderTemplate(
        editingTemplate.id,
        undefined,
        formData,
      );
      if (result?.error) {
        setActionError(result.error);
        return;
      }
      toast.success("Загвар амжилттай шинэчлэгдлээ.");
    } else {
      try {
        await createMutation.mutateAsync(formData);
        toast.success("Загвар амжилттай үүсгэгдлээ.");
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Алдаа гарлаа.");
        return;
      }
    }

    setView("list");
    reset();
    fetchTemplates();
  };

  const handleClose = () => {
    setView("list");
    setEditingTemplate(null);
    setActionError(null);
    reset();
    setOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const title =
    view === "create"
      ? "Шинэ загвар"
      : view === "edit"
        ? "Загвар засах"
        : "Загварууд";

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else setOpen(next);
      }}
      title={title}
      description={
        view === "list" ? "Хэрэглэгдэх загваруудын жагсаалт" : undefined
      }
      panelWidth="32rem"
    >
      {/* ----- List View ----- */}
      {view === "list" && (
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {templates.length} загвар
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <Plus className="size-4 mr-1" />
              Шинэ загвар
            </button>
          </div>

          {actionError && <ErrorBanner error={actionError} />}

          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Ачаалж байна...
            </div>
          )}

          {!loading && templates.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <ListChecks className="size-10 opacity-40" />
              <p className="text-sm">Загвар байхгүй байна</p>
              <p className="text-xs">Шинэ загвар үүсгэнэ үү</p>
            </div>
          )}

          {!loading && templates.length > 0 && (
            <div className="flex flex-col gap-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {t.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.contact_name ? `${t.contact_name} · ` : ""}
                      {t.item_count} бүтээгдэхүүн
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoadIntoCart(t.id)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-8",
                      )}
                      title="Сагсанд ачаалах"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(t)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-8",
                      )}
                      title="Засах"
                    >
                      <PencilSimple className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-8 text-destructive",
                      )}
                      title="Устгах"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----- Create / Edit View ----- */}
      {(view === "create" || view === "edit") && (
        <form
          id="order-template-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-6 py-4"
        >
          {actionError && <ErrorBanner error={actionError} />}

          <FieldGroup>
            {/* Name */}
            <Field>
              <FieldLabel>Нэр *</FieldLabel>
              <Input placeholder="Загварын нэр" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </Field>

            {/* Contact */}
            <Field>
              <FieldLabel>Харилцагч</FieldLabel>
              <Controller
                control={control}
                name="contact_id"
                render={({ field }) => {
                  const trimmedContactQuery = contactQuery.trim().toLowerCase();
                  const filteredContacts = trimmedContactQuery
                    ? customers.filter((c) =>
                        c.name.toLowerCase().includes(trimmedContactQuery),
                      )
                    : customers;

                  return (
                    <Combobox
                      items={filteredContacts}
                      value={
                        customers.find((c) => c.id === field.value) ?? null
                      }
                      onValueChange={(next: CustomerOption | null) => {
                        field.onChange(next?.id ?? "");
                      }}
                      itemToStringValue={(c: CustomerOption | null) =>
                        c?.id ?? ""
                      }
                      itemToStringLabel={(c: CustomerOption | null) =>
                        c?.name ?? ""
                      }
                      inputValue={contactQuery}
                      onInputValueChange={setContactQuery}
                    >
                      <ComboboxInput
                        placeholder="Сонгох (заавал биш)"
                        showTrigger
                        className="w-full"
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>Харилцагч байхгүй</ComboboxEmpty>
                        <ComboboxList>
                          {(c: CustomerOption) => (
                            <ComboboxItem>{c.name}</ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  );
                }}
              />
            </Field>

            {/* Notes */}
            <Field>
              <FieldLabel>Тэмдэглэл</FieldLabel>
              <Textarea
                placeholder="Нэмэлт тэмдэглэл"
                rows={2}
                {...register("notes")}
              />
            </Field>

            {/* Items */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Бүтээгдэхүүнүүд *</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    append({ product_id: "", quantity: 1 });
                    setProductQueries((prev) => [...prev, ""]);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-7 text-xs",
                  )}
                >
                  <Plus className="size-3 mr-1" />
                  Нэмэх
                </button>
              </div>

              {errors.items && (
                <p className="text-xs text-destructive">
                  {errors.items.message}
                </p>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-end gap-2 rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <FieldLabel className="mb-1 text-xs">
                      Бүтээгдэхүүн
                    </FieldLabel>
                    <Controller
                      control={control}
                      name={`items.${index}.product_id`}
                      render={({ field: productField }) => {
                        const query = productQueries[index] ?? "";
                        const trimmedProductQuery = query.trim().toLowerCase();
                        const filteredProducts = trimmedProductQuery
                          ? products.filter((p) =>
                              p.name
                                .toLowerCase()
                                .includes(trimmedProductQuery),
                            )
                          : products;

                        return (
                          <Combobox
                            items={filteredProducts}
                            value={
                              products.find(
                                (p) => p.id === productField.value,
                              ) ?? null
                            }
                            onValueChange={(next: ProductOption | null) => {
                              productField.onChange(next?.id ?? "");
                            }}
                            itemToStringValue={(p: ProductOption | null) =>
                              p?.id ?? ""
                            }
                            itemToStringLabel={(p: ProductOption | null) =>
                              p?.name ?? ""
                            }
                            inputValue={query}
                            onInputValueChange={(v: string) => {
                              setProductQueries((prev) => {
                                const next = [...prev];
                                next[index] = v;
                                return next;
                              });
                            }}
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
                                  <ComboboxItem>
                                    {p.name}
                                    {p.current_stock != null &&
                                      ` (${p.current_stock} ${p.unit ?? "ш"})`}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        );
                      }}
                    />
                    {errors.items?.[index]?.product_id && (
                      <p className="text-xs text-destructive">
                        {errors.items[index]?.product_id?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-20">
                    <FieldLabel className="mb-1 text-xs">Тоо</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-destructive">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        remove(index);
                        setProductQueries((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      className="size-8 flex items-center justify-center text-destructive hover:bg-muted rounded mb-0.5"
                    >
                      <Trash className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </FieldGroup>

          <DrawerFooter>
            <DrawerCancel onClick={handleClose} />
            <DrawerSubmit
              form="order-template-form"
              isPending={isSubmitting || createMutation.isPending}
              label={view === "edit" ? "Шинэчлэх" : "Үүсгэх"}
              loadingLabel="Хадгалж байна..."
            />
          </DrawerFooter>
        </form>
      )}
    </SlideInDrawer>
  );
}
