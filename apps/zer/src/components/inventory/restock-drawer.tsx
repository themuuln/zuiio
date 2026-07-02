"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createPurchaseOrder } from "@/app/(dashboard)/purchases/actions";
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
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { purchaseKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

type SupplierOption = {
  id: string;
  name: string;
  phone: string | null;
};

interface RestockProduct {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  current_stock: number | null;
  min_stock: number | null;
  cost_price: number | null;
}

const restockSchema = z.object({
  supplier_id: z.string().optional(),
  order_date: z.string().min(1, "Огноо шаардлагатай"),
  quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
  unit_cost: z.number().min(0, "Өртөг 0-ээс багагүй"),
});

type RestockValues = z.infer<typeof restockSchema>;

export function RestockDrawer({
  product,
  suppliers,
  open,
  onOpenChange,
}: {
  product: RestockProduct | null;
  suppliers: SupplierOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [supplierQuery, setSupplierQuery] = useState("");

  const restockMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createPurchaseOrder(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: purchaseKeys.all,
    buildOptimistic: (formData) => {
      const orderDate = formData.get("order_date")?.toString() ?? "";
      return {
        id: `opt-${Date.now()}`,
        order_number: `OPT-${Date.now()}`,
        order_date: orderDate,
        status: "draft",
        total_amount: 0,
        created_at: new Date().toISOString(),
        contacts: null,
      };
    },
  });

  const suggestedQty = product
    ? Math.max(1, (product.min_stock ?? 0) - (product.current_stock ?? 0))
    : 1;

  // Auto-select first supplier as default
  const defaultSupplierId = suppliers.length > 0 ? suppliers[0].id : "";

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestockValues>({
    resolver: zodResolver(restockSchema),
    values: {
      supplier_id: defaultSupplierId,
      order_date: new Date().toISOString().slice(0, 10),
      quantity: suggestedQty,
      unit_cost: product?.cost_price ?? 0,
    },
  });

  const [quantity, unitCost] = watch(["quantity", "unit_cost"]);
  const totalAmount = (quantity || 0) * (unitCost || 0);

  const trimmedQuery = supplierQuery.trim().toLowerCase();

  const onSubmit = (data: RestockValues) => {
    if (!product || restockMutation.isPending) return;

    const formData = new FormData();
    if (data.supplier_id) formData.append("supplier_id", data.supplier_id);
    formData.append("order_date", data.order_date);
    formData.append(
      "items",
      JSON.stringify([
        {
          product_id: product.id,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          variant_id: null,
        },
      ]),
    );

    restockMutation.mutate(formData, {
      onSuccess: () => {
        setSupplierQuery("");
        onOpenChange(false);
        reset();
        toast.success("Худалдан авалтын захиалга амжилттай үүсгэгдлээ.");
      },
    });
  };

  const handleCancel = () => {
    setSupplierQuery("");
    reset();
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleCancel();
        else onOpenChange(nextOpen);
      }}
      title="Дахин захиалах"
      description={`${product.name} — одоогийн нөөц: ${product.current_stock ?? 0} ${product.unit ?? "ширхэг"}`}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={handleCancel} />
          <DrawerSubmit
            form="restock-form"
            isPending={isSubmitting || restockMutation.isPending}
            label="Захиалга үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        id="restock-form"
      >
        <ErrorBanner error={restockMutation.error} />

        {/* Product Info (read-only) */}
        <FieldGroup>
          <Field>
            <FieldLabel>Бүтээгдэхүүн</FieldLabel>
            <Input value={product.name} disabled />
          </Field>
          <Field>
            <FieldLabel>Санал болгож буй тоо хэмжээ</FieldLabel>
            <Input
              value={`${suggestedQty} ${product.unit ?? "ширхэг"}`}
              disabled
            />
          </Field>
        </FieldGroup>

        {/* Supplier */}
        <FieldGroup>
          <Field>
            <FieldLabel>Нийлүүлэгч</FieldLabel>
            <Controller
              control={control}
              name="supplier_id"
              render={({ field }) => (
                <Combobox
                  items={suppliers.filter((s) =>
                    trimmedQuery
                      ? s.name.toLowerCase().includes(trimmedQuery)
                      : true,
                  )}
                  value={suppliers.find((s) => s.id === field.value) ?? null}
                  onValueChange={(
                    next: { id: string; name: string } | null,
                  ) => {
                    field.onChange(next?.id ?? "");
                    setSupplierQuery("");
                  }}
                  itemToStringValue={(c: { id: string } | null) => c?.id ?? ""}
                  itemToStringLabel={(c: { name: string } | null) =>
                    c?.name ?? ""
                  }
                  inputValue={supplierQuery}
                  onInputValueChange={setSupplierQuery}
                >
                  <ComboboxInput
                    placeholder="Нийлүүлэгч сонгох"
                    showTrigger
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Нийлүүлэгч байхгүй</ComboboxEmpty>
                    <ComboboxList>
                      {(s: { id: string; name: string }) => (
                        <ComboboxItem key={s.id}>{s.name}</ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
          </Field>
        </FieldGroup>

        {/* Order Details */}
        <FieldGroup>
          <Field>
            <FieldLabel>Захиалгын огноо</FieldLabel>
            <Controller
              control={control}
              name="order_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? formatRouteDate(date) : "")
                  }
                />
              )}
            />
            {errors.order_date && (
              <p className="text-sm text-destructive">
                {errors.order_date.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        {/* Quantity & Unit Cost */}
        <FieldGroup>
          <Field>
            <FieldLabel>Тоо хэмжээ</FieldLabel>
            <Input
              type="number"
              step="any"
              min="0.01"
              placeholder="0"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel>Өртөг</FieldLabel>
            <Controller
              control={control}
              name="unit_cost"
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={(val: number) => field.onChange(val)}
                />
              )}
            />
            {errors.unit_cost && (
              <p className="text-sm text-destructive">
                {errors.unit_cost.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">Нийт дүн</span>
          <span className="text-lg font-semibold">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </form>
    </SlideInDrawer>
  );
}
