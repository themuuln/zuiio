"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { movementKeys, productKeys } from "@/lib/query/keys";
import { createStockMovement } from "../actions";
import type { ProductOption } from "./page";

const movementSchema = z
  .object({
    product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
    type: z.enum(["in", "adjustment"]),
    quantity: z.number(),
    unit_cost: z.number().min(0),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "in" && data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Орлогын тоо хэмжээ 0-ээс их байх ёстой.",
        path: ["quantity"],
      });
    }
    if (data.type === "adjustment" && data.quantity === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Тохируулгын тоо хэмжээ 0-ээс ялгаатай байх ёстой.",
        path: ["quantity"],
      });
    }
  });

type MovementValues = z.infer<typeof movementSchema>;

export function StockMovementForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null,
  );
  const [productQuery, setProductQuery] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<MovementValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: "",
      type: "in",
      quantity: 0,
      unit_cost: 0,
      reference: "",
      notes: "",
    },
  });

  const movementType = watch("type");

  const movementMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createStockMovement(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
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
    onError: (err, _vars, context) => {
      if (context?.movementSnapshot) {
        for (const [key, data] of context.movementSnapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.productSnapshot) {
        for (const [key, data] of context.productSnapshot) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(err.message || "Хөдөлгөөн бүртгэхэд алдаа гарлаа.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: movementKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
      queryClient.invalidateQueries({ queryKey: ["shop_products"] });
    },
  });

  const onSubmit = (data: MovementValues) => {
    if (movementMutation.isPending) return;
    const formData = new FormData();
    formData.append("product_id", data.product_id);
    formData.append("type", data.type);
    formData.append("quantity", String(data.quantity));
    formData.append("unit_cost", String(data.unit_cost));
    formData.append("reference", data.reference ?? "");
    formData.append("notes", data.notes ?? "");
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="product_id">Бүтээгдэхүүн</FieldLabel>
              <Controller
                name="product_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    name="product_id"
                    items={productItems}
                    value={selectedProduct}
                    onValueChange={(next: ProductOption | null) => {
                      setSelectedProduct(next);
                      setProductQuery("");
                      field.onChange(next?.id ?? "");
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
                )}
              />
              {errors.product_id && (
                <p className="text-xs text-destructive">
                  {errors.product_id.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Хөдөлгөөний төрөл</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <NativeSelect
                    id="type"
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      trigger("quantity");
                    }}
                    onBlur={field.onBlur}
                  >
                    <option value="in">Орлого</option>
                    <option value="adjustment">Тохируулга</option>
                  </NativeSelect>
                )}
              />
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
                type="number"
                step={movementType === "adjustment" ? "any" : "0.01"}
                min={movementType === "in" ? "0.01" : undefined}
                placeholder={
                  movementType === "adjustment" ? "5 эсвэл -3" : "100"
                }
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">
                  {errors.quantity.message}
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
              <Controller
                control={control}
                name="unit_cost"
                render={({ field }) => (
                  <CurrencyInput
                    id="unit_cost"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
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
                placeholder="Нэхэмжлэлийн дугаар, захиалгын ID..."
                {...register("reference")}
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
                placeholder="Тэмдэглэл, шалтгаан..."
                {...register("notes")}
              />
            </Field>
          </FieldGroup>

          <ErrorBanner error={movementMutation.error} />

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
