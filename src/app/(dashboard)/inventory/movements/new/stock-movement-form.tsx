"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { movementKeys, productKeys } from "@/lib/query/keys";
import { createStockMovement } from "../actions";
import type { ProductOption } from "./page";

export function StockMovementForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null,
  );
  const [movementType, setMovementType] = useState("in");
  const [quantity, setQuantity] = useState("");
  const [productQuery, setProductQuery] = useState("");

  // Client-side validation errors
  const [clientErrors, setClientErrors] = useState<{
    productId?: string;
    quantity?: string;
  }>({});

  const movementMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createStockMovement(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return { success: true as const };
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey: movementKeys.all() });
      await queryClient.cancelQueries({ queryKey: productKeys.all() });

      const movementSnapshot = queryClient.getQueriesData({
        queryKey: movementKeys.all(),
      });
      const productSnapshot = queryClient.getQueriesData({
        queryKey: productKeys.all(),
      });

      const productId = formData.get("product_id")?.toString() ?? "";
      const type = formData.get("type")?.toString() ?? "in";
      const qty = Number(formData.get("quantity") ?? 0);

      const optimisticMovement = {
        id: `opt-${Date.now()}`,
        product_id: productId,
        type,
        quantity: qty,
        unit_cost: Number(formData.get("unit_cost") ?? 0),
        reference: formData.get("reference")?.toString() ?? null,
        notes: formData.get("notes")?.toString() ?? null,
        created_at: new Date().toISOString(),
        products: selectedProduct
          ? {
              name: selectedProduct.name,
              unit: selectedProduct.unit,
            }
          : null,
      };

      queryClient.setQueriesData(
        { queryKey: movementKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return [optimisticMovement, ...oldData];
          }
          return oldData;
        },
      );

      // Optimistically update product stock
      queryClient.setQueriesData(
        { queryKey: productKeys.all(), type: "active" },
        (oldData: unknown) => {
          if (Array.isArray(oldData)) {
            return oldData.map((p: Record<string, unknown>) => {
              if (p.id === productId) {
                return {
                  ...p,
                  current_stock: Number(p.current_stock ?? 0) + qty,
                };
              }
              return p;
            });
          }
          return oldData;
        },
      );

      return { movementSnapshot, productSnapshot };
    },
    onSuccess: () => {
      toast.success("Хөдөлгөөн амжилттай бүртгэгдлээ.");
      router.push("/inventory/movements");
    },
    onError: (err) => {
      toast.error(err.message || "Хөдөлгөөн бүртгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: movementKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });

  const validateForm = (): boolean => {
    const errors: { productId?: string; quantity?: string } = {};
    const qty = Number(quantity || 0);

    if (!selectedProduct) {
      errors.productId = "Бүтээгдэхүүн сонгоно уу.";
    }

    if (movementType === "in" && qty <= 0) {
      errors.quantity = "Орлогын тоо хэмжээ 0-ээс их байх ёстой.";
    } else if (movementType === "adjustment" && qty === 0) {
      errors.quantity = "Тохируулгын тоо хэмжээ 0-ээс ялгаатай байх ёстой.";
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (movementMutation.isPending) return;

    if (!validateForm()) return;

    const formData = new FormData(e.currentTarget);
    movementMutation.mutate(formData);
  };

  // Product combobox items
  const trimmedProductQuery = productQuery.trim().toLowerCase();
  const productItems: ProductOption[] = useMemo(() => {
    if (!trimmedProductQuery) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmedProductQuery) ||
        p.unit?.toLowerCase().includes(trimmedProductQuery),
    );
  }, [products, trimmedProductQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хөдөлгөөний мэдээлэл</CardTitle>
        <CardDescription>
          Бүтээгдэхүүн, хөдөлгөөний төрөл, тоо хэмжээг оруулна.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="product_id">Бүтээгдэхүүн</FieldLabel>
              <Combobox
                name="product_id"
                items={productItems}
                value={selectedProduct}
                onValueChange={(next: ProductOption | null) => {
                  setSelectedProduct(next);
                  setProductQuery("");
                  if (next) {
                    setClientErrors((prev) => ({ ...prev, productId: "" }));
                  }
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
                  placeholder="Бүтээгдэхүүн сонгох"
                  showTrigger
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Бүтээгдэхүүн байхгүй</ComboboxEmpty>
                  <ComboboxList>
                    {(product: ProductOption) => (
                      <ComboboxItem key={product.id} value={product}>
                        {product.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {clientErrors.productId && (
                <p className="text-xs text-destructive">
                  {clientErrors.productId}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Хөдөлгөөний төрөл</FieldLabel>
              <NativeSelect
                id="type"
                name="type"
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value);
                  const qty = Number(quantity || 0);
                  if (e.target.value === "adjustment" && qty === 0) {
                    setClientErrors((prev) => ({
                      ...prev,
                      quantity:
                        "Тохируулгын тоо хэмжээ 0-ээс ялгаатай байх ёстой.",
                    }));
                  } else if (e.target.value === "in" && qty <= 0) {
                    setClientErrors((prev) => ({
                      ...prev,
                      quantity: "Орлогын тоо хэмжээ 0-ээс их байх ёстой.",
                    }));
                  } else {
                    setClientErrors((prev) => ({ ...prev, quantity: "" }));
                  }
                }}
              >
                <option value="in">Орлого</option>
                <option value="adjustment">Тохируулга</option>
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="quantity">
                Тоо хэмжээ
                {movementType === "adjustment" && (
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    (эерэг эсвэл сөрөг)
                  </span>
                )}
              </FieldLabel>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step={movementType === "adjustment" ? "any" : "0.01"}
                min={movementType === "in" ? "0.01" : undefined}
                placeholder={
                  movementType === "adjustment" ? "5 эсвэл -3" : "100"
                }
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setClientErrors((prev) => ({ ...prev, quantity: "" }));
                }}
              />
              {clientErrors.quantity && (
                <p className="text-xs text-destructive">
                  {clientErrors.quantity}
                </p>
              )}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Одоогийн үлдэгдэл: {selectedProduct.current_stock ?? 0}{" "}
                  {selectedProduct.unit ?? "ширхэг"}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="unit_cost">
                Нэгж өртөг{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                id="unit_cost"
                name="unit_cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="reference">
                Лавлагаа{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Input
                id="reference"
                name="reference"
                placeholder="Нэхэмжлэлийн дугаар, захиалгын ID..."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">
                Тэмдэглэл{" "}
                <span className="text-xs text-muted-foreground">
                  (заавал биш)
                </span>
              </FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Тэмдэглэл, шалтгаан..."
              />
            </Field>
          </FieldGroup>

          {movementMutation.error ? (
            <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {movementMutation.error.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={movementMutation.isPending}
            className={buttonVariants({ variant: "default" })}
          >
            {movementMutation.isPending ? "Хадгалах..." : "Хадгалах"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
