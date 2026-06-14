"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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

export function SaleForm({
  products,
  customers,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    products[0] ?? null,
  );
  const [quantity, setQuantity] = useState("1");

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
      router.push("/sales");
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saleMutation.isPending) return;
    const formData = new FormData(e.currentTarget);
    saleMutation.mutate(formData);
  };

  const total =
    Number(quantity || 0) * Number(selectedProduct?.sale_price ?? 0);

  // --- Product combobox (creatable) ---
  const [productQuery, setProductQuery] = useState("");
  const highlightedProductRef = useRef<ProductOption | null | undefined>(null);
  const trimmedProductQuery = productQuery.trim();
  const loweredProductQuery = trimmedProductQuery.toLowerCase();
  const productExactMatch =
    loweredProductQuery === "" ||
    products.some((p) => p.name.toLowerCase() === loweredProductQuery);
  const [createdProducts, setCreatedProducts] = useState<ProductOption[]>([]);
  const allProducts = [...products, ...createdProducts];
  const productItems: ProductOption[] =
    trimmedProductQuery !== "" && !productExactMatch
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

  // --- Payment method combobox (creatable) ---
  const [paymentQuery, setPaymentQuery] = useState("");
  const highlightedPaymentRef = useRef<string | null | undefined>(null);
  const trimmedPaymentQuery = paymentQuery.trim().toLowerCase();
  const [allPaymentMethods, setAllPaymentMethods] = useState<string[]>([
    ...initialPaymentMethods,
  ]);
  const paymentExactMatch =
    trimmedPaymentQuery === "" ||
    allPaymentMethods.some((m) => m.toLowerCase() === trimmedPaymentQuery);
  const paymentItems: string[] =
    trimmedPaymentQuery !== "" && !paymentExactMatch
      ? [...allPaymentMethods, paymentQuery.trim()]
      : allPaymentMethods;

  // --- Status combobox (creatable) ---
  const [statusQuery, setStatusQuery] = useState("");
  const highlightedStatusRef = useRef<string | null | undefined>(null);
  const trimmedStatusQuery = statusQuery.trim().toLowerCase();
  const [allStatuses, setAllStatuses] = useState<string[]>([
    ...initialStatuses,
  ]);
  const statusExactMatch =
    trimmedStatusQuery === "" ||
    allStatuses.some((s) => s.toLowerCase() === trimmedStatusQuery);
  const statusItems: string[] =
    trimmedStatusQuery !== "" && !statusExactMatch
      ? [...allStatuses, statusQuery.trim()]
      : allStatuses;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product_id">Бүтээгдэхүүн</FieldLabel>
            <Combobox
              name="product_id"
              items={productItems}
              value={selectedProduct}
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
                  setSelectedProduct(created);
                  setProductQuery("");
                  return;
                }
                setSelectedProduct(next);
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
              onItemHighlighted={(item) => {
                highlightedProductRef.current = item;
              }}
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
            <FieldDescription>
              {selectedProduct
                ? `${formatCurrency(Number(selectedProduct.sale_price ?? 0))} • Үлдэгдэл ${
                    selectedProduct.current_stock ?? 0
                  } ${selectedProduct.unit ?? "ширхэг"}`
                : "Бүтээгдэхүүн байхгүй байна."}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="quantity">Тоо хэмжээ</FieldLabel>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="unit_price">Нэгж үнэ</FieldLabel>
            <Input
              id="unit_price"
              name="unit_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={selectedProduct?.sale_price ?? 0}
              key={selectedProduct?.id ?? "price"}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="paid_amount">Төлсөн дүн</FieldLabel>
            <Input
              id="paid_amount"
              name="paid_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={total || 0}
              key={`${selectedProduct?.id ?? "paid"}-${quantity}`}
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="payment_method">Төлбөрийн арга</FieldLabel>
            <Combobox
              name="payment_method"
              items={paymentItems}
              defaultValue="cash"
              onValueChange={(next: string | null) => {
                if (next && !allPaymentMethods.includes(next)) {
                  setAllPaymentMethods((prev) => [...prev, next]);
                }
                setPaymentQuery("");
              }}
              itemToStringLabel={(item: string) =>
                paymentMethodLabels[item] ??
                (allPaymentMethods.includes(item) ? item : `"${item}" үүсгэх`)
              }
              inputValue={paymentQuery}
              onInputValueChange={setPaymentQuery}
              onItemHighlighted={(item) => {
                highlightedPaymentRef.current = item;
              }}
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
                      initialPaymentMethods.includes(item as any)
                        ? (paymentMethodLabels[item] ?? item)
                        : `"${item}" үүсгэх`}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel htmlFor="status">Төлөв</FieldLabel>
            <Combobox
              name="status"
              items={statusItems}
              defaultValue="completed"
              onValueChange={(next: string | null) => {
                if (next && !allStatuses.includes(next)) {
                  setAllStatuses((prev) => [...prev, next]);
                }
                setStatusQuery("");
              }}
              itemToStringLabel={(item: string) =>
                statusLabels[item] ??
                (allStatuses.includes(item) ? item : `"${item}" үүсгэх`)
              }
              inputValue={statusQuery}
              onInputValueChange={setStatusQuery}
              onItemHighlighted={(item) => {
                highlightedStatusRef.current = item;
              }}
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
                      initialStatuses.includes(item as any)
                        ? (statusLabels[item] ?? item)
                        : `"${item}" үүсгэх`}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel htmlFor="sale_date">Огноо</FieldLabel>
            <Input
              id="sale_date"
              name="sale_date"
              type="date"
              defaultValue={formatRouteDate()}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="customer_name">Харилцагчийн нэр</FieldLabel>
            <Input
              id="customer_name"
              name="customer_name"
              list="customers"
              placeholder="Walk-in эсвэл Бат"
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
              name="customer_phone"
              placeholder="9911...."
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Тэмдэглэл</FieldLabel>
            <Input
              id="notes"
              name="notes"
              placeholder="Хүргэлттэй, хэсэгчлэн төлсөн гэх мэт"
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
