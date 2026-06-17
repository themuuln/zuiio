"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { StaffPicker } from "@/components/shop/staff-picker";
import { Button } from "@/components/ui/button";
import { z } from "zod";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { productKeys, saleKeys } from "@/lib/query/keys";
import { createSale } from "./actions";

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

const saleSchema = z.object({
  product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  quantity: z.number().positive("Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_price: z.number().min(0, "Нэгж үнэ 0-ээс багагүй"),
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
}: {
  products: ProductOption[];
  customers: CustomerOption[];
  /** Called after a successful sale instead of redirecting to /sales. Used by the drawer variant. */
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const defaultProduct = products[0] ?? null;
  const initialQuantity = 1;
  const initialTotal = initialQuantity * (defaultProduct?.sale_price ?? 0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      product_id: defaultProduct?.id ?? "",
      quantity: initialQuantity,
      unit_price: defaultProduct?.sale_price ?? 0,
      paid_amount: initialTotal || 0,
      payment_method: "cash",
      status: "completed",
      sale_date: formatRouteDate(),
      customer_name: "",
      customer_phone: "",
      notes: "",
    },
  });

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

      // Parse form data for optimistic updates
      const productId = formData.get("product_id")?.toString() ?? "";
      const quantityVal = Number(formData.get("quantity") ?? 0);
      const unitPrice = Number(formData.get("unit_price") ?? 0);
      const totalAmount = quantityVal * unitPrice;
      const paidAmount = Number(formData.get("paid_amount") ?? totalAmount);
      const paymentMethod =
        formData.get("payment_method")?.toString() ?? "cash";
      const status = formData.get("status")?.toString() ?? "completed";
      const saleDate =
        formData.get("sale_date")?.toString() ?? formatRouteDate();
      const customerName = formData.get("customer_name")?.toString() ?? "";

      // Build optimistic sale entry
      const optimisticSale = {
        id: `opt-${Date.now()}`,
        product_id: productId,
        quantity: quantityVal,
        unit_price: unitPrice,
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

      // Optimistically decrement stock in products caches
      queryClient.setQueriesData(
        { queryKey: productKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return oldData.map((product: Record<string, unknown>) => {
              if (product.id === productId) {
                return {
                  ...product,
                  current_stock: Math.max(
                    0,
                    Number(product.current_stock ?? 0) - quantityVal,
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
    onSuccess: () => {
      if (onSuccess) {
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
    formData.append("product_id", data.product_id);
    formData.append("quantity", String(data.quantity));
    formData.append("unit_price", String(data.unit_price));
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

  // --- Product combobox (creatable) ---
  const [productQuery, setProductQuery] = useState("");
  const trimmedProductQuery = productQuery.trim();
  const loweredProductQuery = trimmedProductQuery.toLowerCase();
  const productLabelMatch =
    loweredProductQuery === "" ||
    products.some((p) => p.name.toLowerCase().includes(loweredProductQuery));
  const [createdProducts, setCreatedProducts] = useState<ProductOption[]>([]);
  const allProducts = [...products, ...createdProducts];
  const productItems: ProductOption[] =
    trimmedProductQuery !== "" && !productLabelMatch
      ? [
          ...allProducts,
          {
            id: `__create__${loweredProductQuery}`,
            name: trimmedProductQuery,
            sale_price: null,
            current_stock: null,
            unit: null,
          },
        ]
      : allProducts;

  const watchedProductId = watch("product_id");
  const selectedProduct =
    allProducts.find((p) => p.id === watchedProductId) ?? null;
  const watchedQuantity = watch("quantity");
  const total =
    Number(watchedQuantity || 0) * Number(selectedProduct?.sale_price ?? 0);

  // Reset paid_amount when product or quantity changes
  useEffect(() => {
    setValue("paid_amount", total || 0);
  }, [total, setValue]);

  // --- Payment method combobox (creatable) ---
  const [paymentQuery, setPaymentQuery] = useState("");
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
  const [statusQuery, setStatusQuery] = useState("");
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product_id">Бүтээгдэхүүн</FieldLabel>
            <Controller
              control={control}
              name="product_id"
              render={({ field }) => (
                <Combobox
                  name={field.name}
                  items={productItems}
                  value={allProducts.find((p) => p.id === field.value) ?? null}
                  onValueChange={(next) => {
                    if (next?.id.startsWith("__create__")) {
                      const created: ProductOption = {
                        id: `new_${Date.now()}`,
                        name: next.name,
                        sale_price: null,
                        current_stock: null,
                        unit: null,
                      };
                      setCreatedProducts((prev) => [...prev, created]);
                      field.onChange(created.id);
                      setProductQuery("");
                      return;
                    }
                    field.onChange(next?.id ?? "");
                    setProductQuery("");
                  }}
                  itemToStringValue={(product: ProductOption | null) =>
                    product?.id ?? ""
                  }
                  itemToStringLabel={(product: ProductOption | null) =>
                    product?.name ?? ""
                  }
                  inputValue={productQuery}
                  onInputValueChange={setProductQuery}
                >
                  <ComboboxInput
                    id="product_id"
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
            <FieldDescription>
              {selectedProduct
                ? `${formatCurrency(Number(selectedProduct.sale_price ?? 0))} • Үлдэгдэл ${
                    selectedProduct.current_stock ?? 0
                  } ${selectedProduct.unit ?? "ширхэг"}`
                : "Бүтээгдэхүүн байхгүй байна."}
            </FieldDescription>
            {errors.product_id && (
              <p className="text-xs text-destructive">
                {errors.product_id.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="quantity">Тоо хэмжээ</FieldLabel>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="0.01"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_price">Нэгж үнэ</FieldLabel>
            <Input
              id="unit_price"
              type="number"
              min="0"
              step="0.01"
              {...register("unit_price", { valueAsNumber: true })}
            />
            {errors.unit_price && (
              <p className="text-xs text-destructive">
                {errors.unit_price.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="paid_amount">Төлсөн дүн</FieldLabel>
            <Input
              id="paid_amount"
              type="number"
              min="0"
              step="0.01"
              {...register("paid_amount", { valueAsNumber: true })}
            />
            {errors.paid_amount && (
              <p className="text-xs text-destructive">
                {errors.paid_amount.message}
              </p>
            )}
          </Field>
        </FieldGroup>

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

          <Field>
            <FieldLabel htmlFor="customer_name">Харилцагчийн нэр</FieldLabel>
            <Input
              id="customer_name"
              list="customers"
              placeholder="Walk-in эсвэл Бат"
              {...register("customer_name")}
            />
            <datalist id="customers">
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name} />
              ))}
            </datalist>
          </Field>

          <Field>
            <FieldLabel htmlFor="customer_phone">Утас</FieldLabel>
            <Input
              id="customer_phone"
              placeholder="9911...."
              {...register("customer_phone")}
            />
          </Field>

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

      <div className="rounded-none border border-border bg-muted/40 px-4 py-3 text-sm">
        Нийт дүн: <span className="font-semibold">{formatCurrency(total)}</span>
      </div>

      {saleMutation.error ? (
        <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {saleMutation.error.message}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={saleMutation.isPending || !products.length}
      >
        {saleMutation.isPending ? "Хадгалах..." : "Борлуулалт хадгалах"}
      </Button>
    </form>
  );
}
