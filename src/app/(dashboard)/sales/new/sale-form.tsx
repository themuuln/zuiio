"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Plus, Trash } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CustomerPicker } from "@/components/shop/customer-picker";
import { StaffPicker } from "@/components/shop/staff-picker";
import {
  VariantPicker,
  type SelectedVariant,
} from "@/components/products/variant-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { productKeys, saleKeys } from "@/lib/query/keys";
import { createSale } from "./actions";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";

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
  phone: string | null;
};

const initialPaymentMethods = [
  "cash",
  "bank_transfer",
  "card",
  "invoice",
] as const;
const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  bank_transfer: "Данс",
  card: "Карт",
  invoice: "Нэхэмжлэл",
};

const initialStatuses = ["completed", "pending", "cancelled"] as const;
const statusLabels: Record<string, string> = {
  completed: "Дууссан",
  pending: "Хүлээгдэж буй",
  cancelled: "Цуцлагдсан",
};

const lineItemSchema = z.object({
  product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  quantity: z.number().positive("Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_price: z.number().min(0, "Нэгж үнэ 0-ээс багагүй"),
  variant_id: z.string().optional(),
});

const saleSchema = z.object({
  items: z.array(lineItemSchema).min(1, "Дор хаяж нэг мөр оруулна уу"),
  paid_amount: z.number().min(0, "Төлсөн дүн 0-ээс багагүй"),
  payment_method: z.string().min(1, "Төлбөрийн арга сонгоно уу"),
  status: z.string().min(1, "Төлөв сонгоно уу"),
  sale_date: z.string().min(1, "Огноо оруулна уу"),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
});

type SaleValues = z.infer<typeof saleSchema>;

export function SaleForm({
  products,
  customers,
  onSuccess,
  onOpenDetail,
  onReopenForm,
  formId,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
  onSuccess?: () => void;
  onOpenDetail?: (saleId: string) => void;
  onReopenForm?: () => void;
  formId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [keepOpen, setKeepOpen] = useState(false);
  const [paymentQuery, setPaymentQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState("");
  const [variantSelections, setVariantSelections] = useState<
    Record<number, SelectedVariant | null>
  >({});

  // Per-row product combobox query states
  const [productQueries, setProductQueries] = useState<string[]>([""]);
  const [createdProducts, setCreatedProducts] = useState<ProductOption[]>([]);
  const allProducts = useMemo(
    () => [...products, ...createdProducts],
    [products, createdProducts],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [{ product_id: "", quantity: 1, unit_price: 0, variant_id: undefined }],
      paid_amount: 0,
      payment_method: "cash",
      status: "completed",
      sale_date: formatRouteDate(),
      customer_name: "",
      customer_phone: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const appendRow = useCallback(() => {
    append({ product_id: "", quantity: 1, unit_price: 0, variant_id: undefined });
    setProductQueries((prev) => [...prev, ""]);
  }, [append]);

  const removeRow = useVariantLineItemRemove(remove, setVariantSelections, setProductQueries);

  const resetForm = () => {
    reset(undefined, { keepDefaultValues: false });
    setSelectedContactId(null);
    setVariantSelections({});
    setProductQueries([""]);
    setPaymentQuery("");
    setStatusQuery("");
  };

  // Watched values
  const watchedItems = watch("items");
  const watchedStatus = watch("status");
  const watchedPaidAmount = watch("paid_amount");

  // Compute subtotals per row and grand total
  const subtotals = useMemo(() => {
    return (watchedItems ?? []).map(
      (item) => Number(item.quantity || 0) * Number(item.unit_price || 0),
    );
  }, [watchedItems]);

  const grandTotal = useMemo(
    () => subtotals.reduce((sum, s) => sum + s, 0),
    [subtotals],
  );

  const isManualEditRef = useRef(false);

  // Derive payment state based on grand total
  const paymentState =
    watchedPaidAmount === 0
      ? "Төлөөгүй"
      : (watchedPaidAmount ?? 0) >= grandTotal
        ? "Төлөгдсөн"
        : "Хэсэгчлэн";

  const paymentBadgeVariant: "default" | "secondary" | "outline" =
    paymentState === "Төлөгдсөн"
      ? "default"
      : paymentState === "Хэсэгчлэн"
        ? "secondary"
        : "outline";

  const remaining = Math.max(0, grandTotal - (watchedPaidAmount || 0));

  // Quick action handler for payment amounts
  const handleQuickAction = (action: "all" | "half" | "zero") => {
    isManualEditRef.current = true;
    if (action === "all") {
      setValue("paid_amount", grandTotal || 0);
    } else if (action === "half") {
      setValue("paid_amount", (grandTotal || 0) / 2);
    } else if (action === "zero") {
      setValue("paid_amount", 0);
    }
  };

  // Stock warnings per row
  const stockWarnings = useMemo(() => {
    return (watchedItems ?? []).map((item, index) => {
      if (watchedStatus === "cancelled") return null;
      // Check variant stock if a variant is selected
      const variant = variantSelections[index];
      if (variant) {
        if (Number(item.quantity || 0) > Number(variant.current_stock ?? 0)) {
          return `Үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${variant.current_stock ?? 0} ширхэг)`;
        }
        return null;
      }
      const product = allProducts.find((p) => p.id === item.product_id);
      if (!product || product.current_stock === null) return null;
      if (Number(item.quantity || 0) > product.current_stock) {
        return `Үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${product.current_stock} ${product.unit ?? "ширхэг"})`;
      }
      return null;
    });
  }, [watchedItems, allProducts, watchedStatus, variantSelections]);

  // Any stock insufficient across all rows
  const anyStockInsufficient = useMemo(
    () => stockWarnings.some((w) => w !== null),
    [stockWarnings],
  );

  const saleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createSale(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: saleKeys.all() });
      await queryClient.cancelQueries({ queryKey: productKeys.all() });

      const salesSnapshot = queryClient.getQueriesData({
        queryKey: saleKeys.all(),
      });
      const productsSnapshot = queryClient.getQueriesData({
        queryKey: productKeys.all(),
      });

      // Parse items from form data for optimistic updates
      const itemsRaw = formData.get("items")?.toString() ?? "[]";
      let optimisticItems: {
        productId: string;
        quantity: number;
        unitPrice: number;
        variantId?: string | null;
      }[] = [];
      try {
        optimisticItems = JSON.parse(itemsRaw);
      } catch {
        // Ignore parse errors in optimistic update
      }

      const totalAmount = optimisticItems.reduce(
        (sum: number, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const paidAmount = Number(formData.get("paid_amount") ?? totalAmount);
      const paymentMethod =
        formData.get("payment_method")?.toString() ?? "cash";
      const status = formData.get("status")?.toString() ?? "completed";
      const saleDate =
        formData.get("sale_date")?.toString() ?? formatRouteDate();
      const customerName = formData.get("customer_name")?.toString() ?? "";

      // Build optimistic sale entry with combined total
      const optimisticSale = {
        id: `opt-${Date.now()}`,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        payment_method: paymentMethod,
        status,
        sale_date: saleDate,
        created_at: new Date().toISOString(),
        contacts: customerName ? { name: customerName } : null,
      };

      // Optimistically add sale to sales list caches
      queryClient.setQueriesData(
        { queryKey: saleKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return [optimisticSale, ...oldData];
          }
          return oldData;
        },
      );

      // Aggregate quantities by productId for stock decrement
      const productQuantities = new Map<string, number>();
      for (const item of optimisticItems) {
        productQuantities.set(
          item.productId,
          (productQuantities.get(item.productId) ?? 0) + item.quantity,
        );
      }

      // Optimistically decrement stock per product
      queryClient.setQueriesData(
        { queryKey: productKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return oldData.map((product: Record<string, unknown>) => {
              const qty = productQuantities.get(product.id as string);
              if (qty) {
                return {
                  ...product,
                  current_stock: Math.max(
                    0,
                    Number(product.current_stock ?? 0) - qty,
                  ),
                };
              }
              return product;
            });
          }
          return oldData;
        },
      );

      return { salesSnapshot, productsSnapshot };
    },
    onSuccess: (result) => {
      const saleResult = result as
        | {
            success: true;
            sale?: {
              id: string;
              total_amount: number;
              customer_name: string | null;
            };
          }
        | undefined;
      const saleId =
        saleResult?.success && saleResult.sale ? saleResult.sale.id : "";
      const totalAmount = saleResult?.success
        ? (saleResult.sale?.total_amount ?? 0)
        : 0;
      const customerName = saleResult?.success
        ? (saleResult.sale?.customer_name ?? "")
        : "";

      toast.custom(
        (t) => (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="size-4 shrink-0 text-green-600" />
              <span>
                Борлуулалт амжилттай: {formatCurrency(totalAmount)}
                {customerName ? ` - ${customerName}` : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  toast.dismiss(t);
                  onOpenDetail?.(saleId ?? "");
                }}
              >
                Дэлгэрэнгүй
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.dismiss(t);
                  resetForm();
                  onReopenForm?.();
                }}
              >
                Дахин бүртгэх
              </Button>
            </div>
          </div>
        ),
        { duration: 8000 },
      );

      if (keepOpen) {
        resetForm();
      } else if (onSuccess) {
        onSuccess();
      } else {
        router.push("/sales");
      }
    },
    onError: (err, _vars, context) => {
      if (context?.salesSnapshot) {
        for (const [key, data] of context.salesSnapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.productsSnapshot) {
        for (const [key, data] of context.productsSnapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message || "Борлуулалт үүсгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });

  const onSubmit = (data: SaleValues) => {
    if (saleMutation.isPending) return;
    const formData = new FormData();

    // Build items JSON array
    const itemsPayload = data.items.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      variantId: item.variant_id ?? null,
    }));
    formData.append("items", JSON.stringify(itemsPayload));

    formData.append("paid_amount", String(data.paid_amount));
    formData.append("payment_method", data.payment_method);
    formData.append("status", data.status);
    formData.append("sale_date", data.sale_date);
    if (data.customer_name) {
      formData.append("customer_name", data.customer_name);
    }
    if (data.customer_phone) {
      formData.append("customer_phone", data.customer_phone);
    }
    if (data.notes) {
      formData.append("notes", data.notes);
    }
    saleMutation.mutate(formData);
  };

  // --- Payment method combobox (creatable) ---
  const trimmedPaymentQuery = paymentQuery.trim().toLowerCase();
  const [allPaymentMethods, setAllPaymentMethods] = useState<string[]>([
    ...initialPaymentMethods,
  ]);
  const paymentLabelMatch =
    trimmedPaymentQuery === "" ||
    allPaymentMethods.some((m) => {
      const label = paymentMethodLabels[m] ?? m;
      return label.toLowerCase().includes(trimmedPaymentQuery);
    });
  const paymentItems: string[] =
    trimmedPaymentQuery !== "" && !paymentLabelMatch
      ? [...allPaymentMethods, paymentQuery.trim()]
      : allPaymentMethods;

  // --- Status combobox (creatable) ---
  const trimmedStatusQuery = statusQuery.trim().toLowerCase();
  const [allStatuses, setAllStatuses] = useState<string[]>([
    ...initialStatuses,
  ]);
  const statusLabelMatch =
    trimmedStatusQuery === "" ||
    allStatuses.some((s) => {
      const label = statusLabels[s] ?? s;
      return label.toLowerCase().includes(trimmedStatusQuery);
    });
  const statusItems: string[] =
    trimmedStatusQuery !== "" && !statusLabelMatch
      ? [...allStatuses, statusQuery.trim()]
      : allStatuses;

  // Helper to get product items for a given row's query
  const getProductItems = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      const lowered = trimmed.toLowerCase();
      const labelMatch =
        lowered === "" ||
        products.some((p) => p.name.toLowerCase().includes(lowered));
      if (trimmed !== "" && !labelMatch) {
        return [
          ...allProducts,
          {
            id: `__create__${lowered}`,
            name: trimmed,
            sale_price: null as number | null,
            current_stock: null as number | null,
            unit: null as string | null,
          },
        ];
      }
      return allProducts;
    },
    [allProducts, products],
  );

  const updateProductQuery = useCallback((index: number, value: string) => {
    setProductQueries((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleProductSelect = useCallback(
    (index: number, product: ProductOption | null) => {
      // Clear variant selection when product changes
      setVariantSelections((prev) => ({ ...prev, [index]: null }));
      if (!product) {
        setValue(`items.${index}.product_id`, "");
        setValue(`items.${index}.unit_price`, 0);
        setValue(`items.${index}.variant_id`, undefined);
        return;
      }
      if (product.id.startsWith("__create__")) {
        const created: ProductOption = {
          id: `new_${Date.now()}`,
          name: product.name,
          sale_price: null,
          current_stock: null,
          unit: null,
        };
        setCreatedProducts((prev) => [...prev, created]);
        setValue(`items.${index}.product_id`, created.id);
        setValue(`items.${index}.unit_price`, 0);
        setValue(`items.${index}.variant_id`, undefined);
        updateProductQuery(index, "");
        return;
      }
      setValue(`items.${index}.product_id`, product.id);
      setValue(`items.${index}.unit_price`, product.sale_price ?? 0);
      setValue(`items.${index}.variant_id`, undefined);
      updateProductQuery(index, "");
    },
    [setValue, updateProductQuery],
  );

  const handleVariantSelect = useCallback(
    (index: number, variant: SelectedVariant | null) => {
      setVariantSelections((prev) => ({ ...prev, [index]: variant }));
      if (variant) {
        setValue(`items.${index}.unit_price`, variant.sale_price ?? 0);
        setValue(`items.${index}.variant_id`, variant.variant_id);
      } else {
        // Revert to parent product's sale_price when variant is deselected
        const product = allProducts.find(
          (p) => p.id === watchedItems?.[index]?.product_id,
        );
        setValue(`items.${index}.unit_price`, product?.sale_price ?? 0);
        setValue(`items.${index}.variant_id`, undefined);
      }
    },
    [allProducts, watchedItems, setValue],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id={formId}>
      {/* Line Items Section */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">
          Бүтээгдэхүүнүүд
        </span>

        {/* Header row */}
        <div className="flex gap-2 text-xs text-muted-foreground px-1">
          <div className="flex-1">Бүтээгдэхүүн</div>
          <div className="w-20">Тоо хэмжээ</div>
          <div className="w-24">Нэгж үнэ</div>
          <div className="w-28 text-right">Дүн</div>
          <div className="w-10" />
        </div>

        {/* Line item rows */}
        {fields.map((field, index) => {
          const productForRow = allProducts.find(
            (p) => p.id === watchedItems?.[index]?.product_id,
          );
          const rowQuery = productQueries[index] ?? "";
          const rowItems = getProductItems(rowQuery);

          return (
            <div key={field.id}>
              <div className="flex gap-2 items-start">
                {/* Product combobox */}
                <div className="flex-1 min-w-0">
                  <Controller
                    control={control}
                    name={`items.${index}.product_id`}
                    render={({ field: controllerField }) => (
                      <Combobox
                        name={controllerField.name}
                        items={rowItems}
                        value={
                          allProducts.find(
                            (p) => p.id === controllerField.value,
                          ) ?? null
                        }
                        onValueChange={(next) =>
                          handleProductSelect(index, next)
                        }
                        itemToStringValue={(product: ProductOption | null) =>
                          product?.id ?? ""
                        }
                        itemToStringLabel={(product: ProductOption | null) =>
                          product?.name ?? ""
                        }
                        inputValue={rowQuery}
                        onInputValueChange={(val) =>
                          updateProductQuery(index, val)
                        }
                      >
                        <ComboboxInput
                          placeholder="Сонгох"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>Бүтээгдэхүүн байхгүй</ComboboxEmpty>
                          <ComboboxList>
                            {(product: ProductOption) => (
                              <ComboboxItem key={product.id} value={product}>
                                {product.id.startsWith("__create__")
                                  ? `"${product.name}" үүсгэх`
                                  : product.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    )}
                  />
                  {/* Product info and stock warning */}
                  {productForRow ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(Number(productForRow.sale_price ?? 0))} •
                      Үлдэгдэл {productForRow.current_stock ?? 0}{" "}
                      {productForRow.unit ?? "ширхэг"}
                    </p>
                  ) : null}
                  {productForRow && (
                    <div className="mt-1">
                      <VariantPicker
                        productId={productForRow.id}
                        onSelect={(variant) =>
                          handleVariantSelect(index, variant)
                        }
                      />
                    </div>
                  )}
                  {errors.items?.[index]?.product_id && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.items[index]?.product_id?.message}
                    </p>
                  )}
                  {stockWarnings[index] && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {stockWarnings[index]}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    {...register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                {/* Unit price */}
                <div className="w-24">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`items.${index}.unit_price`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.items?.[index]?.unit_price && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.items[index]?.unit_price?.message}
                    </p>
                  )}
                </div>

                {/* Subtotal */}
                <div className="w-28 pt-2 text-right text-sm font-medium">
                  {formatCurrency(subtotals[index] ?? 0)}
                </div>

                {/* Remove button */}
                <div className="w-10 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(index)}
                    disabled={fields.length <= 1}
                    aria-label="Мөр устгах"
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add row button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={appendRow}
          className="mt-1"
        >
          <Plus className="size-4" />
          Мөр нэмэх
        </Button>

        {errors.items && !Array.isArray(errors.items) && (
          <p className="text-xs text-destructive">{errors.items.message}</p>
        )}
      </div>

      {/* Grand Total & Payment Summary */}
      <div className="rounded-none border border-border bg-muted/40 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span>
            Нийт дүн:{" "}
            <span className="font-semibold">{formatCurrency(grandTotal)}</span>
          </span>
          <Badge variant={paymentBadgeVariant}>{paymentState}</Badge>
        </div>
        <div className="mt-1 text-muted-foreground">
          Үлдэгдэл: {formatCurrency(remaining)}
        </div>
      </div>

      {/* Paid Amount with quick actions */}
      <div>
        <Field>
          <FieldLabel htmlFor="paid_amount">Төлсөн дүн</FieldLabel>
          <Input
            id="paid_amount"
            type="number"
            min="0"
            step="0.01"
            {...register("paid_amount", {
              valueAsNumber: true,
              onChange: () => {
                isManualEditRef.current = true;
              },
            })}
          />
          <div className="mt-1 flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickAction("all")}
            >
              Бүгд
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickAction("half")}
            >
              50%
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickAction("zero")}
            >
              0
            </Button>
          </div>
          {errors.paid_amount && (
            <p className="text-xs text-destructive">
              {errors.paid_amount.message}
            </p>
          )}
        </Field>
      </div>

      {/* Right column fields */}
      <div className="grid gap-5 md:grid-cols-2">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="payment_method">Төлбөрийн арга</FieldLabel>
            <Controller
              control={control}
              name="payment_method"
              render={({ field }) => (
                <Combobox
                  name={field.name}
                  items={paymentItems}
                  value={field.value}
                  onValueChange={(next: string | null) => {
                    if (next && !allPaymentMethods.includes(next)) {
                      setAllPaymentMethods((prev) => [...prev, next]);
                    }
                    field.onChange(next ?? "cash");
                    setPaymentQuery("");
                  }}
                  itemToStringLabel={(item: string | null) =>
                    item
                      ? (paymentMethodLabels[item] ??
                        (allPaymentMethods.includes(item)
                          ? item
                          : `"${item}" үүсгэх`))
                      : ""
                  }
                  inputValue={paymentQuery}
                  onInputValueChange={setPaymentQuery}
                >
                  <ComboboxInput
                    id="payment_method"
                    placeholder="Сонгох"
                    showTrigger
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Арга байхгүй</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {allPaymentMethods.includes(item) ||
                          initialPaymentMethods.includes(
                            item as (typeof initialPaymentMethods)[number],
                          )
                            ? (paymentMethodLabels[item] ?? item)
                            : `"${item}" үүсгэх`}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
            {errors.payment_method && (
              <p className="text-xs text-destructive">
                {errors.payment_method.message}
              </p>
            )}
          </Field>

          <StaffPicker />

          <Field>
            <FieldLabel htmlFor="status">Төлөв</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Combobox
                  name={field.name}
                  items={statusItems}
                  value={field.value}
                  onValueChange={(next: string | null) => {
                    if (next && !allStatuses.includes(next)) {
                      setAllStatuses((prev) => [...prev, next]);
                    }
                    field.onChange(next ?? "completed");
                    setStatusQuery("");
                  }}
                  itemToStringLabel={(item: string | null) =>
                    item
                      ? (statusLabels[item] ??
                        (allStatuses.includes(item)
                          ? item
                          : `"${item}" үүсгэх`))
                      : ""
                  }
                  inputValue={statusQuery}
                  onInputValueChange={setStatusQuery}
                >
                  <ComboboxInput
                    id="status"
                    placeholder="Сонгох"
                    showTrigger
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Төлөв байхгүй</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {allStatuses.includes(item) ||
                          initialStatuses.includes(
                            item as (typeof initialStatuses)[number],
                          )
                            ? (statusLabels[item] ?? item)
                            : `"${item}" үүсгэх`}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
            {errors.status && (
              <p className="text-xs text-destructive">
                {errors.status.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="sale_date">Огноо</FieldLabel>
            <Controller
              control={control}
              name="sale_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? formatRouteDate(date) : "")
                  }
                />
              )}
            />
            {errors.sale_date && (
              <p className="text-xs text-destructive">
                {errors.sale_date.message}
              </p>
            )}
          </Field>

          <CustomerPicker
            contacts={customers}
            selectedContactId={selectedContactId}
            customerName={watch("customer_name") ?? ""}
            customerPhone={watch("customer_phone") ?? ""}
            onSelectContact={(contact) => {
              setSelectedContactId(contact?.id ?? null);
            }}
            onNameChange={(name) => {
              setValue("customer_name", name);
            }}
            onPhoneChange={(phone) => {
              setValue("customer_phone", phone);
            }}
          />

          <Field>
            <FieldLabel htmlFor="notes">Тэмдэглэл</FieldLabel>
            <Input
              id="notes"
              placeholder="Хүргэлттэй, хэсэгчлэн төлсөн гэх мэт"
              {...register("notes")}
            />
          </Field>
        </FieldGroup>
      </div>

      {/* Error display */}
      <ErrorBanner error={saleMutation.error} />

      {/* Footer */}
      {!formId && (
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            Хэвээр үлдээх (дахин бүртгэх)
          </label>
          <Button
            type="submit"
            disabled={
              saleMutation.isPending || !products.length || anyStockInsufficient
            }
          >
            {saleMutation.isPending ? "Хадгалах..." : "Борлуулалт хадгалах"}
          </Button>
        </div>
      )}
    </form>
  );
}
