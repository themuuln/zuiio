"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createBundle } from "@/app/(dashboard)/products/bundles/actions";
import type { SimpleProductOption } from "@/app/(dashboard)/products/bundles/types";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ProductPicker } from "@/components/products/product-picker";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
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
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

const bundleSchema = z.object({
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

type BundleValues = z.infer<typeof bundleSchema>;

interface BundleCreateDrawerProps {
  trigger?: React.ReactNode;
  products?: SimpleProductOption[];
}

export function BundleCreateDrawer({
  trigger,
  products = [],
}: BundleCreateDrawerProps) {
  const [open, setOpen] = useState(false);

  const bundleMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createBundle(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: bundleKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      sku: formData.get("sku")?.toString() || null,
      sale_price: Number(formData.get("sale_price") ?? 0) || null,
      description: formData.get("description")?.toString() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      product_bundle_items: [],
    }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BundleValues>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      sku: "",
      sale_price: 0,
      description: "",
      items: [{ product_id: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  const selectedIds = new Set(items.map((i) => i.product_id).filter(Boolean));

  const onSubmit = (data: BundleValues) => {
    if (bundleMutation.isPending) return;
    const formData = new FormData();
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

    bundleMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        toast.success("Багц амжилттай үүсгэгдлээ.");
      },
    });
  };

  const handleCancel = () => {
    reset();
    setOpen(false);
  };

  return (
    <>
      <SlideInDrawer
        open={open}
        onOpenChange={setOpen}
        title="Шинэ багц"
        description="Олон бүтээгдэхүүнийг нэгтгэн багц үүсгэх"
        trigger={trigger}
        panelWidth="32rem"
        footer={
          <DrawerFooter>
            <DrawerCancel onClick={handleCancel} />
            <DrawerSubmit
              form="bundle-form"
              isPending={isSubmitting || bundleMutation.isPending}
              label="Багц үүсгэх"
              loadingLabel="Үүсгэж байна..."
            />
          </DrawerFooter>
        }
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          id="bundle-form"
          className="space-y-5"
        >
          <ErrorBanner error={bundleMutation.error} />

          {/* Basic Info */}
          <FieldGroup>
            <Field>
              <FieldLabel>Багцын нэр</FieldLabel>
              <Input placeholder="Жнь: Чихэртэй хөтөч" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
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
                    {fields.map((field, index) => {
                      return (
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
                      );
                    })}
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
      </SlideInDrawer>
    </>
  );
}
