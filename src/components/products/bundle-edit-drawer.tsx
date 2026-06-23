"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { NotePencil, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { SimpleProductOption } from "@/app/(dashboard)/products/bundles/types";
import { updateBundle } from "@/app/(dashboard)/products/bundles/actions";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ProductPicker } from "@/components/products/product-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { bundleKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

const bundleEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  sku: z.string().optional(),
  sale_price: z.number().min(0).optional(),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
        quantity: z.number().min(0.01, "Тоо хэмжээ 0-ээс их байх ёстой"),
      }),
    )
    .min(1, "Дор хаяж нэг бараа оруулна уу"),
});

type BundleEditValues = z.infer<typeof bundleEditSchema>;

export interface BundleEditData {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number | null;
  description: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export function BundleEditDrawer({
  bundle,
  products = [],
}: {
  bundle: BundleEditData;
  products?: SimpleProductOption[];
}) {
  const [open, setOpen] = useState(false);

  const editMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateBundle(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: bundleKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      name: formData.get("name")?.toString() ?? "",
      sku: formData.get("sku")?.toString() || null,
      sale_price: Number(formData.get("sale_price") ?? 0) || null,
      description: formData.get("description")?.toString() || null,
    }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BundleEditValues>({
    resolver: zodResolver(bundleEditSchema),
    defaultValues: {
      name: bundle.name,
      sku: bundle.sku ?? "",
      sale_price: bundle.sale_price ?? 0,
      description: bundle.description ?? "",
      items:
        bundle.items.length > 0
          ? bundle.items
          : [{ product_id: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const selectedIds = new Set(items.map((i) => i.product_id).filter(Boolean));

  const onSubmit = (data: BundleEditValues) => {
    if (editMutation.isPending) return;
    const formData = new FormData();
    formData.append("id", bundle.id);
    formData.append("name", data.name);
    formData.append("sku", data.sku ?? "");
    formData.append("sale_price", String(data.sale_price ?? 0));
    formData.append("description", data.description ?? "");
    formData.append(
      "items",
      JSON.stringify(
        data.items.map((item) => ({
          product_id: item.product_id,
          variant_id: null,
          quantity: item.quantity,
        })),
      ),
    );

    editMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Багц амжилттай шинэчлэгдлээ.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Засах"
        >
          <NotePencil className="size-3.5" />
        </button>
      }
      title="Багц засах"
      description={bundle.name}
      panelWidth="32rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            isPending={isSubmitting || editMutation.isPending}
            label="Хадгалах"
            loadingLabel="Хадгалж байна..."
            form="edit-bundle-form"
          />
        </DrawerFooter>
      }
    >
      <form
        id="edit-bundle-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <ErrorBanner error={editMutation.error} />

        {/* Basic Info */}
        <FieldGroup>
          <Field>
            <FieldLabel>Багцын нэр</FieldLabel>
            <Input placeholder="Жнь: Чихэртэй хөтөч" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel>SKU (optional)</FieldLabel>
            <Input placeholder="BNDL-001" {...register("sku")} />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldLabel>Борлуулалтын үнэ</FieldLabel>
            <Controller
              control={control}
              name="sale_price"
              render={({ field }) => (
                <CurrencyInput
                  value={field.value ?? 0}
                  onChange={(val: number) => field.onChange(val)}
                />
              )}
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldLabel>Тайлбар (optional)</FieldLabel>
            <Textarea
              placeholder="Багцын тайлбар"
              {...register("description")}
            />
          </Field>
        </FieldGroup>

        {/* Bundle Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Багцын бараанууд</h3>

          {errors.items?.message && (
            <p className="text-xs text-destructive">{errors.items.message}</p>
          )}

          {fields.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Бүтээгдэхүүн</TableHead>
                    <TableHead className="w-24 text-right">
                      Тоо хэмжээ
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`items.${index}.product_id`}
                          render={({ field: pField }) => (
                            <ProductPicker
                              products={products}
                              value={pField.value}
                              onValueChange={(productId) =>
                                pField.onChange(productId)
                              }
                              excludeIds={selectedIds}
                              placeholder="Бараа сонгох"
                              className="h-8"
                            />
                          )}
                        />
                        {errors.items?.[index]?.product_id && (
                          <p className="text-xs text-destructive">
                            {errors.items[index]?.product_id?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`items.${index}.quantity`}
                          render={({ field: qField }) => (
                            <Input
                              type="number"
                              step="any"
                              min="0.01"
                              className="h-8 text-right"
                              value={qField.value}
                              onChange={(e) =>
                                qField.onChange(Number(e.target.value) || 0)
                              }
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => remove(index)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => append({ product_id: "", quantity: 1 })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Бараа нэмэх
          </Button>
        </div>
      </form>
    </DrawerLayout>
  );
}
