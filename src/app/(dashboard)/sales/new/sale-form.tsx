"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  CaretDown,
  CaretUp,
  CheckCircle,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type SelectedVariant,
  VariantPicker,
} from "@/components/products/variant-picker";
import { ProductBrowserDrawer } from "@/components/sales/product-browser-drawer";
import { StaffPicker } from "@/components/shop/staff-picker";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { productKeys, saleKeys } from "@/lib/query/keys";
import { useVariantLineItemRemove } from "@/lib/use-variant-line-items";
import { cn } from "@/lib/utils";
import { createSale } from "./actions";

const CameraScanner = dynamic(
  () => import("@/components/shop/camera-scanner").then((m) => m.CameraScanner),
  { ssr: false },
);

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  barcode: string | null;
  image_url: string | null;
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

function SaleFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("space-y-4 border-b border-border/60 pb-6", className)}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function SaleForm({
  products,
  onSuccess,
  onOpenDetail,
  onReopenForm,
  formId,
}: {
  products: ProductOption[];
  onSuccess?: () => void;
  onOpenDetail?: (saleId: string) => void;
  onReopenForm?: () => void;
  formId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [keepOpen, setKeepOpen] = useState(false);
  const [barcodeScannerIndex, setBarcodeScannerIndex] = useState<number | null>(
    null,
  );
  const scannerIndexRef = useRef<number | null>(null);
  const scannerNextRef = useRef<number>(0);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productPickerIndex, setProductPickerIndex] = useState<number | null>(
    null,
  );
  const [paymentQuery, setPaymentQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    formState: { errors },
  } = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [
        { product_id: "", quantity: 1, unit_price: 0, variant_id: undefined },
      ],
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
    append({
      product_id: "",
      quantity: 1,
      unit_price: 0,
      variant_id: undefined,
    });
  }, [append]);

  const removeRow = useVariantLineItemRemove(remove, setVariantSelections);

  const resetForm = () => {
    reset(undefined, { keepDefaultValues: false });
    setVariantSelections({});
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
      const product = products.find((p) => p.id === item.product_id);
      if (!product || product.current_stock === null) return null;
      if (Number(item.quantity || 0) > product.current_stock) {
        return `Үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${product.current_stock} ${product.unit ?? "ширхэг"})`;
      }
      return null;
    });
  }, [watchedItems, products, watchedStatus, variantSelections]);

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
      setValue(`items.${index}.product_id`, product.id);
      setValue(`items.${index}.unit_price`, product.sale_price ?? 0);
      setValue(`items.${index}.variant_id`, undefined);
    },
    [setValue],
  );

  const handleVariantSelect = useCallback(
    (index: number, variant: SelectedVariant | null) => {
      setVariantSelections((prev) => ({ ...prev, [index]: variant }));
      if (variant) {
        setValue(`items.${index}.unit_price`, variant.sale_price ?? 0);
        setValue(`items.${index}.variant_id`, variant.variant_id);
      } else {
        // Revert to parent product's sale_price when variant is deselected
        const product = products.find(
          (p) => p.id === watchedItems?.[index]?.product_id,
        );
        setValue(`items.${index}.unit_price`, product?.sale_price ?? 0);
        setValue(`items.${index}.variant_id`, undefined);
      }
    },
    [products, watchedItems, setValue],
  );

  const handleBarcodeScan = useCallback(
    (barcode: string): { found: true } | { found: false; error?: string } => {
      const product = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase(),
      );

      if (!product) {
        return { found: false };
      }

      const stock = Number(product.current_stock ?? 0);
      if (stock <= 0) {
        return {
          found: false,
          error: `"${product.name}" дууссан байна.`,
        };
      }

      const currentIndex = scannerIndexRef.current;
      if (currentIndex !== null) {
        setValue(`items.${currentIndex}.product_id`, product.id);
        setValue(`items.${currentIndex}.unit_price`, product.sale_price ?? 0);
        setValue(`items.${currentIndex}.variant_id`, undefined);
        setValue(`items.${currentIndex}.quantity`, 1);

        // Rapid scan: append next row and point scanner at it
        const nextIndex = scannerNextRef.current;
        scannerNextRef.current = nextIndex + 1;
        append({
          product_id: "",
          quantity: 1,
          unit_price: 0,
          variant_id: undefined,
        });
        scannerIndexRef.current = nextIndex;
        setBarcodeScannerIndex(nextIndex);
      }

      return { found: true };
    },
    [products, setValue, append],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 pb-1"
      id={formId}
    >
      <ErrorBanner error={saleMutation.error} />

      <SaleFormSection title="Бүтээгдэхүүний мөрүүд">
        <div className="space-y-4">
          <div className="space-y-1">
            {fields.map((field, index) => {
              const productForRow = products.find(
                (p) => p.id === watchedItems?.[index]?.product_id,
              );

              return (
                <div
                  key={field.id}
                  className="border-b border-border/40 pb-2 last:border-b-0"
                >
                  <div className="flex items-center gap-1.5">
                    {/* Row number */}
                    <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>

                    {/* Product selector */}
                    <button
                      type="button"
                      onClick={() => {
                        setProductPickerIndex(index);
                        setProductPickerOpen(true);
                      }}
                      className={cn(
                        "flex h-8 min-w-0 flex-1 items-center truncate rounded-md border border-input bg-background px-2 text-xs transition-colors hover:bg-muted/40",
                        !productForRow && "text-muted-foreground",
                      )}
                    >
                      {productForRow ? (
                        <span className="truncate font-medium">
                          {productForRow.name}
                        </span>
                      ) : (
                        "Бараа сонгох"
                      )}
                    </button>

                    {/* Quantity */}
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      className="h-8 w-16 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />

                    {/* Unit Price */}
                    <Controller
                      control={control}
                      name={`items.${index}.unit_price`}
                      render={({ field }) => (
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          className="h-8 w-20 text-xs"
                        />
                      )}
                    />

                    {/* Total */}
                    <div className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-primary">
                      {formatCurrency(subtotals[index] ?? 0)}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          scannerIndexRef.current = index;
                          scannerNextRef.current = fields.length;
                          setBarcodeScannerIndex(index);
                        }}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                        title="Баркод скан хийх"
                      >
                        <Camera className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={fields.length <= 1}
                        className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Variant picker */}
                  {productForRow && (
                    <div className="mt-1.5">
                      <VariantPicker
                        productId={productForRow.id}
                        onSelect={(variant) =>
                          handleVariantSelect(index, variant)
                        }
                      />
                    </div>
                  )}

                  {/* Stock warning */}
                  {stockWarnings[index] && (
                    <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                      {stockWarnings[index]}
                    </p>
                  )}

                  {/* Field errors */}
                  {errors.items?.[index] && (
                    <p className="mt-1 text-[11px] text-destructive">
                      {errors.items[index]?.product_id?.message ||
                        errors.items[index]?.quantity?.message ||
                        errors.items[index]?.unit_price?.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {errors.items && !Array.isArray(errors.items) && (
            <p className="text-xs text-destructive">{errors.items.message}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={appendRow}
          className="w-full h-11"
        >
          <Plus className="size-4" />
          Мөр нэмэх
        </Button>
      </SaleFormSection>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <SaleFormSection title="Төлбөр">
            <FieldGroup className="gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="paid_amount">Төлсөн дүн</FieldLabel>
                  <Controller
                    control={control}
                    name="paid_amount"
                    render={({ field }) => (
                      <CurrencyInput
                        id="paid_amount"
                        value={field.value}
                        onChange={(value) => {
                          isManualEditRef.current = true;
                          field.onChange(value);
                        }}
                        className="h-10"
                      />
                    )}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => handleQuickAction("all")}
                    >
                      Бүгд
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => handleQuickAction("half")}
                    >
                      Хагас
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => handleQuickAction("zero")}
                    >
                      Төлөөгүй
                    </Button>
                  </div>
                  {errors.paid_amount && (
                    <p className="text-xs text-destructive">
                      {errors.paid_amount.message}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="payment_method">
                    Төлбөрийн арга
                  </FieldLabel>
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
              </div>
            </FieldGroup>
          </SaleFormSection>
        </div>

        <aside className="lg:sticky lg:top-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">Тооцоо</h2>
            <Badge variant={paymentBadgeVariant}>{paymentState}</Badge>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Нийт дүн
              </span>
              <p className="mt-0.5 text-base font-semibold">
                {formatCurrency(grandTotal)}
              </p>
            </div>
            <div className="px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Төлсөн
              </span>
              <p className="mt-0.5 text-base font-semibold">
                {formatCurrency(watchedPaidAmount ?? 0)}
              </p>
            </div>
            <div className="px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Үлдэгдэл
              </span>
              <p className="mt-0.5 text-base font-semibold">
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          <div className="mt-3 px-3.5 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Нийт мөр</span>
              <span className="font-medium">{fields.length}</span>
            </div>
            {anyStockInsufficient ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Зарим мөрийн үлдэгдэл хүрэлцэхгүй байна.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Мөрүүдийн тооцоо хэвийн байна.
              </p>
            )}
          </div>
        </aside>
      </div>

      <section>
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 pb-4 text-left"
        >
          <span className="text-base font-semibold tracking-tight">
            Нэмэлт тохиргоо
          </span>
          {showAdvanced ? (
            <CaretUp className="size-4 text-muted-foreground" />
          ) : (
            <CaretDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {showAdvanced && (
          <div className="border-t border-border/60 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="customer_name">
                    Харилцагчийн нэр
                  </FieldLabel>
                  <Input
                    id="customer_name"
                    placeholder="Нэр оруулах"
                    className="h-10"
                    {...register("customer_name")}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="customer_phone">Утас</FieldLabel>
                  <Input
                    id="customer_phone"
                    placeholder="Утасны дугаар"
                    className="h-10"
                    {...register("customer_phone")}
                  />
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
              </FieldGroup>

              <FieldGroup className="gap-4">
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

                <Field>
                  <FieldLabel htmlFor="notes">Тэмдэглэл</FieldLabel>
                  <Textarea
                    id="notes"
                    placeholder="Хүргэлттэй, хэсэгчлэн төлсөн гэх мэт"
                    className="min-h-24"
                    {...register("notes")}
                  />
                </Field>
              </FieldGroup>
            </div>
          </div>
        )}
      </section>

      {!formId && (
        <div className="flex items-center justify-end gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            Хэвээр үлдээх
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

      {/* Camera scanner overlay */}
      {barcodeScannerIndex !== null && (
        <CameraScanner
          onScan={handleBarcodeScan}
          onClose={() => {
            scannerIndexRef.current = null;
            setBarcodeScannerIndex(null);
          }}
        />
      )}

      {/* Product browser drawer */}
      <ProductBrowserDrawer
        open={productPickerOpen}
        onOpenChange={(next) => {
          setProductPickerOpen(next);
          if (!next) setProductPickerIndex(null);
        }}
        products={products}
        onSelect={(product) => {
          if (productPickerIndex !== null) {
            handleProductSelect(productPickerIndex, product);
          }
        }}
      />
    </form>
  );
}
