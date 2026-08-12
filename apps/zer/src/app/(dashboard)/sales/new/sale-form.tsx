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
import { capture } from "@zuiio/capture";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { OfflineIndicator } from "@/components/pos/offline-indicator";
import {
  type SelectedVariant,
  VariantPicker,
} from "@/components/products/variant-picker";
import { ProductBrowserDrawer } from "@/components/sales/product-browser-drawer";
import { StaffPicker } from "@/components/shop/staff-picker";
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
import { useBarcodeScanner } from "@/lib/hooks/use-barcode-scanner";
import { useI18n } from "@/lib/i18n/provider";
import { useOffline } from "@/lib/offline/offline-provider";
import { queueOfflineAction } from "@/lib/offline-sync";
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
  has_variants: boolean;
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

const paymentSplitSchema = z.object({
  method: z.string().min(1, "Төлбөрийн арга сонгоно уу"),
  amount: z.number().min(0, "Дүн 0-ээс багагүй"),
});

const saleSchema = z.object({
  items: z.array(lineItemSchema).min(1, "Дор хаяж нэг мөр оруулна уу"),
  payment_splits: z
    .array(paymentSplitSchema)
    .min(1, "Дор хаяж нэг төлбөрийн мөр оруулна уу"),
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
  hasReceiptPrinter = false,
  onSuccess,
  onOpenDetail,
  onReopenForm,
  formId,
}: {
  products: ProductOption[];
  /** Org setting: navigate to the receipt with ?print=1 after a sale. */
  hasReceiptPrinter?: boolean;
  onSuccess?: () => void;
  onOpenDetail?: (saleId: string) => void;
  onReopenForm?: () => void;
  formId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { isOnline, pendingCount, isReplaying, replay, refreshPendingCount } =
    useOffline();

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
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [
        { product_id: "", quantity: 1, unit_price: 0, variant_id: undefined },
      ],
      payment_splits: [{ method: "bank_transfer", amount: 0 }],
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

  const {
    fields: splitFields,
    append: appendSplit,
    remove: removeSplit,
  } = useFieldArray({
    control,
    name: "payment_splits",
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
    setStatusQuery("");
  };

  // Watched values
  const watchedItems = watch("items");
  const watchedStatus = watch("status");
  const watchedSplits = watch("payment_splits");

  // Compute subtotals per row and grand total. These are derived inline (not
  // useMemo): react-hook-form's setValue() mutates nested form values in
  // place, so watch("items") can return the same array reference after a
  // nested field changes. A useMemo keyed on that reference would keep the
  // totals frozen at their previous value (e.g. ₮ 0 after setting a price).
  const subtotals = (watchedItems ?? []).map(
    (item) => Number(item.quantity || 0) * Number(item.unit_price || 0),
  );

  const grandTotal = subtotals.reduce((sum, s) => sum + s, 0);

  const totalPaid = (watchedSplits ?? []).reduce(
    (sum, s) => sum + (Number(s.amount) || 0),
    0,
  );

  const remaining = Math.max(0, grandTotal - totalPaid);

  // Auto-fill first split with grandTotal on initial load
  const initializedSplit = useRef(false);
  const prevGrandTotal = useRef(0);
  useEffect(() => {
    if (!initializedSplit.current && grandTotal > 0) {
      initializedSplit.current = true;
      setValue("payment_splits.0.amount", grandTotal);
      prevGrandTotal.current = grandTotal;
    }
    // When grandTotal changes and user hasn't manually edited, sync the amount
    if (
      initializedSplit.current &&
      grandTotal !== prevGrandTotal.current &&
      splitFields.length === 1
    ) {
      const currentAmt = watchedSplits?.[0]?.amount ?? 0;
      if (currentAmt === prevGrandTotal.current || currentAmt === 0) {
        setValue("payment_splits.0.amount", grandTotal);
      }
      prevGrandTotal.current = grandTotal;
    }
  }, [grandTotal, splitFields.length, watchedSplits, setValue]);

  // Stock warnings per row. Derived inline for the same reason as the
  // totals: watchedItems can keep its reference while nested fields change.
  const stockWarnings = (watchedItems ?? []).map((item, index) => {
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

  // Any stock insufficient across all rows
  const anyStockInsufficient = stockWarnings.some((w) => w !== null);

  // Shared optimistic-update logic: adds the sale to sales caches and
  // decrements product stock locally. Used by the online mutation (onMutate,
  // with snapshots for rollback) and by the offline queue path.
  const applyOptimisticSale = useCallback(
    (formData: FormData) => {
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
      } catch (e) {
        capture(e, { context: "sale-form: parse optimistic items" });
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
    },
    [queryClient],
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

      applyOptimisticSale(formData);

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

      if (hasReceiptPrinter && saleId) {
        // Receipt-printer shop: open the receipt view and auto-print it.
        router.push(`/sales/${saleId}?print=1`);
        return;
      }

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
      queryClient.invalidateQueries({ queryKey: ["shop_products"] });
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

    // Compute payment totals from splits
    const totalPaidFromSplits = (data.payment_splits ?? []).reduce(
      (sum, s) => sum + (Number(s.amount) || 0),
      0,
    );
    const uniqueMethods = [
      ...new Set(data.payment_splits.map((s) => s.method)),
    ];
    const paymentMethod =
      uniqueMethods.length === 1 ? uniqueMethods[0] : "mixed";

    formData.append("paid_amount", String(totalPaidFromSplits));
    formData.append("payment_method", paymentMethod);
    formData.append("payment_splits", JSON.stringify(data.payment_splits));
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

    if (!isOnline) {
      // Offline — queue the sale for replay and update the cache locally.
      const fields: Record<string, string> = {};
      formData.forEach((value, key) => {
        fields[key] = value.toString();
      });
      applyOptimisticSale(formData);
      void queueOfflineAction("sale", fields, [
        saleKeys.all(),
        productKeys.all(),
      ] as unknown as string[][])
        .then(() => {
          toast.success(t("offline.queue.saleQueued"));
          void refreshPendingCount();
          if (keepOpen) {
            resetForm();
          } else if (onSuccess) {
            onSuccess();
          } else {
            router.push("/sales");
          }
        })
        .catch((error) => {
          capture(error, { context: "sale-form: queue offline" });
          toast.error(t("offline.queue.error"));
        });
      return;
    }

    saleMutation.mutate(formData);
  };

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
          (p) => p.id === getValues(`items.${index}.product_id`),
        );
        setValue(`items.${index}.unit_price`, product?.sale_price ?? 0);
        setValue(`items.${index}.variant_id`, undefined);
      }
    },
    [products, setValue, getValues],
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

  // Wedge (USB/HID keyboard-emulation) scanner: find the product by barcode,
  // bump an existing line or append a new one, and let variant products open
  // the VariantPicker so the cashier picks the exact variant.
  const handleWedgeScan = useCallback(
    (code: string) => {
      const barcode = code.trim();
      if (!barcode) return;

      const product = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase(),
      );

      if (!product) {
        toast.error(t("pos.barcode.notFound", { code: barcode }));
        return;
      }

      if (Number(product.current_stock ?? 0) <= 0) {
        toast.error(t("pos.barcode.outOfStock", { name: product.name }));
        return;
      }

      // Variant product: add a row with the product selected so the
      // VariantPicker opens for the exact variant instead of auto-adding.
      if (product.has_variants) {
        append({
          product_id: product.id,
          quantity: 1,
          unit_price: product.sale_price ?? 0,
          variant_id: undefined,
        });
        return;
      }

      // Plain product: bump an existing matching line, else append a new one.
      const existingIndex = (watchedItems ?? []).findIndex(
        (item) => item.product_id === product.id && !item.variant_id,
      );
      if (existingIndex >= 0) {
        setValue(
          `items.${existingIndex}.quantity`,
          Number(watchedItems?.[existingIndex]?.quantity || 0) + 1,
        );
        return;
      }

      append({
        product_id: product.id,
        quantity: 1,
        unit_price: product.sale_price ?? 0,
        variant_id: undefined,
      });
    },
    [products, watchedItems, append, setValue, t],
  );

  // Wedge scanner is paused while the camera overlay is open so a scan is
  // never handled twice.
  useBarcodeScanner({
    onScan: handleWedgeScan,
    enabled: barcodeScannerIndex === null,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 pb-1"
      id={formId}
    >
      <ErrorBanner error={saleMutation.error} />

      <SaleFormSection
        title="Бүтээгдэхүүний мөрүүд"
        description={t("pos.barcode.hint")}
      >
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

                  {/* Variant picker (only for variant products) */}
                  {productForRow?.has_variants && (
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
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {stockWarnings[index]}
                    </p>
                  )}

                  {/* Field errors */}
                  {errors.items?.[index] && (
                    <p className="mt-1 text-xs text-destructive">
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
            <div className="space-y-3">
              {splitFields.map((field, index) => {
                const methodError =
                  errors.payment_splits?.[index]?.method?.message;
                const amountError =
                  errors.payment_splits?.[index]?.amount?.message;
                return (
                  <div key={field.id}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <Controller
                          control={control}
                          name={`payment_splits.${index}.method`}
                          render={({ field: methodField }) => (
                            <select
                              value={methodField.value}
                              onChange={(e) =>
                                methodField.onChange(e.target.value)
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {initialPaymentMethods.map((m) => (
                                <option key={m} value={m}>
                                  {paymentMethodLabels[m]}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                      <div className="flex-[2]">
                        <Controller
                          control={control}
                          name={`payment_splits.${index}.amount`}
                          render={({ field: amountField }) => (
                            <CurrencyInput
                              value={amountField.value}
                              onChange={amountField.onChange}
                              className="h-10"
                            />
                          )}
                        />
                      </div>
                      {splitFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplit(index)}
                          className="mt-2 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash className="size-4" />
                        </button>
                      )}
                    </div>
                    {methodError && (
                      <p className="mt-1 text-xs text-destructive">
                        {methodError}
                      </p>
                    )}
                    {amountError && (
                      <p className="mt-1 text-xs text-destructive">
                        {amountError}
                      </p>
                    )}
                  </div>
                );
              })}

              {remaining > 0 && (
                <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/20">
                  <span className="text-amber-700 dark:text-amber-400">
                    Үлдэгдэл
                  </span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              )}

              {totalPaid > 0 && remaining <= 0 && (
                <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm dark:bg-green-950/20">
                  <span className="text-green-700 dark:text-green-400">
                    Төлөгдсөн
                  </span>
                  <CheckCircle className="size-4 text-green-600" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendSplit({ method: "bank_transfer", amount: 0 })
                  }
                >
                  <Plus className="size-4" />
                  Мөр нэмэх
                </Button>
                {remaining > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const lastIdx = splitFields.length - 1;
                      const currentAmount =
                        watchedSplits?.[lastIdx]?.amount || 0;
                      setValue(
                        `payment_splits.${lastIdx}.amount`,
                        currentAmount + remaining,
                      );
                    }}
                  >
                    Үлдсэнийг бөглөх
                  </Button>
                )}
              </div>
            </div>
          </SaleFormSection>
        </div>

        <aside className="lg:sticky lg:top-0">
          <div className="mt-3 space-y-2">
            <div className="px-3 py-2.5">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Нийт дүн
              </span>
              <p className="mt-0.5 text-base font-semibold">
                {formatCurrency(grandTotal)}
              </p>
            </div>
            <div className="border-t border-border/60 px-3 py-2.5">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Төлсөн дүн
              </span>
              <p className="mt-0.5 text-base font-semibold">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            {remaining > 0 && (
              <div className="border-t border-border/60 px-3 py-2.5">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-amber-600 dark:text-amber-400">
                  Үлдэгдэл
                </span>
                <p className="mt-0.5 text-base font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(remaining)}
                </p>
              </div>
            )}
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
          <OfflineIndicator
            pendingCount={pendingCount}
            onSync={() => void replay()}
            isSyncing={isReplaying}
          />
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
