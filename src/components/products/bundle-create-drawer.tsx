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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [productQueries, setProductQueries] = useState<Record<number, string>>(
    {},
  );

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

  const onSubmit = async (data: BundleValues) => {
    setServerError(null);
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

    const result = await createBundle(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setOpen(false);
      reset();
      toast.success("Багц амжилттай үүсгэгдлээ.");
    }
  };

  const handleCancel = () => {
    setServerError(null);
    reset();
    setOpen(false);
  };

  return (
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
            isPending={isSubmitting}
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
        {serverError && <ErrorBanner error={serverError} />}

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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Багцын бараанууд</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_id: "", quantity: 1 })}
            >
              <Plus className="mr-1.5 size-3.5" />
              Бараа нэмэх
            </Button>
          </div>

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
                    const trimmedQuery = (productQueries[index] ?? "")
                      .trim()
                      .toLowerCase();
                    const available = products.filter(
                      (p) =>
                        !selectedIds.has(p.id) ||
                        p.id === items[index]?.product_id,
                    );
                    const filtered = trimmedQuery
                      ? available.filter((p) =>
                          p.name.toLowerCase().includes(trimmedQuery),
                        )
                      : available;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Controller
                            control={control}
                            name={`items.${index}.product_id`}
                            render={({ field: pField }) => (
                              <Combobox
                                items={filtered}
                                value={
                                  products.find((p) => p.id === pField.value) ??
                                  null
                                }
                                onValueChange={(
                                  next: { id: string; name: string } | null,
                                ) => {
                                  pField.onChange(next?.id ?? "");
                                  setProductQueries((prev) => ({
                                    ...prev,
                                    [index]: "",
                                  }));
                                }}
                                itemToStringValue={(c: { id: string } | null) =>
                                  c?.id ?? ""
                                }
                                itemToStringLabel={(
                                  c: { name: string } | null,
                                ) => c?.name ?? ""}
                                inputValue={productQueries[index] ?? ""}
                                onInputValueChange={(q) =>
                                  setProductQueries((prev) => ({
                                    ...prev,
                                    [index]: q,
                                  }))
                                }
                              >
                                <ComboboxInput
                                  placeholder="Бараа хайх..."
                                  showTrigger
                                  className="h-8"
                                />
                                <ComboboxContent>
                                  <ComboboxEmpty>Олдсонгүй</ComboboxEmpty>
                                  <ComboboxList>
                                    {(p: SimpleProductOption) => (
                                      <ComboboxItem key={p.id}>
                                        <div className="flex flex-col">
                                          <span>{p.name}</span>
                                          {p.sku && (
                                            <span className="text-xs text-muted-foreground">
                                              {p.sku}
                                            </span>
                                          )}
                                        </div>
                                      </ComboboxItem>
                                    )}
                                  </ComboboxList>
                                </ComboboxContent>
                              </Combobox>
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
        </div>
      </form>
    </SlideInDrawer>
  );
}
