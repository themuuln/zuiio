"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useEffect, useState } from "react";
import {
  Controller,
  type Resolver,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ProductPicker } from "@/components/products/product-picker";
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
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Textarea } from "@/components/ui/textarea";
import { useOrgId } from "@/lib/hooks/use-org-id";
import { bomKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { getBom, updateBom } from "./bom-actions";

const bomEditItemSchema = z.object({
  material_product_id: z.string().min(1, "Материал сонгоно уу"),
  quantity: z.coerce.number().min(0.01, "Тоо хэмжээ 0-ээ их байх ёстой"),
  unit: z.string().min(1, "Хэмжих нэгж шаардлагатай"),
  required_width_mm: z.coerce.number().optional().nullable(),
  required_length_mm: z.coerce.number().optional().nullable(),
  required_thickness_mm: z.coerce.number().optional().nullable(),
  estimated_unit_cost: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const bomEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  notes: z.string().optional().nullable(),
  items: z
    .array(bomEditItemSchema)
    .min(1, "Дор хаяж нэг материал шаардлагатай"),
});

type BomEditValues = z.infer<typeof bomEditSchema>;

interface ProductOption {
  id: string;
  name: string;
}

export type BomEditData = {
  id: string;
  name: string;
};

export function BomEditDrawer({
  bom,
  open,
  onOpenChange,
}: {
  bom: BomEditData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [_productsLoading, setProductsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch BOM details
  const { data: bomDetail, isPending: bomLoading } = useQuery({
    queryKey: [...bomKeys.all(), bom.id],
    queryFn: async () => {
      const result = await getBom(bom.id);
      if (!result || !("data" in result))
        throw new Error("error" in result ? result.error : "Unknown error");
      return result.data;
    },
    enabled: open,
  });

  // Fetch products
  const { organizationId: editOrgId } = useOrgId();
  useEffect(() => {
    if (!open || !editOrgId) return;
    const supabase = createClient();
    supabase
      .from("products")
      .select("id, name")
      .eq("organization_id", editOrgId)
      .is("deleted_at", null)
      .order("name")
      .then(({ data, error }) => {
        if (error) capture(error);
        if (data) setProducts(data);
        setProductsLoading(false);
      });
  }, [open, editOrgId]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BomEditValues>({
    resolver: zodResolver(bomEditSchema) as Resolver<BomEditValues>,
    defaultValues: {
      name: bom.name,
      notes: "",
      items: [],
    },
  });

  // Populate form when BOM data loads
  useEffect(() => {
    if (bomDetail) {
      reset({
        name: bomDetail.name,
        notes: bomDetail.notes ?? "",
        items: bomDetail.items.map((item) => ({
          material_product_id: item.material_product_id,
          quantity: item.quantity,
          unit: item.unit,
          required_width_mm: item.required_width_mm,
          required_length_mm: item.required_length_mm,
          required_thickness_mm: item.required_thickness_mm,
          estimated_unit_cost: item.estimated_unit_cost,
          notes: item.notes,
        })),
      });
    }
  }, [bomDetail, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: BomEditValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await updateBom({
        bom_id: bom.id,
        name: data.name,
        notes: data.notes ?? null,
        items: data.items.map((item, index) => ({
          material_product_id: item.material_product_id,
          quantity: item.quantity,
          unit: item.unit,
          required_width_mm: item.required_width_mm ?? undefined,
          required_length_mm: item.required_length_mm ?? undefined,
          required_thickness_mm: item.required_thickness_mm ?? undefined,
          estimated_unit_cost: item.estimated_unit_cost ?? undefined,
          sort_order: index,
          notes: item.notes ?? undefined,
        })),
      });

      if (result?.error) {
        setSubmitError(result.error);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: bomKeys.all() });
      onOpenChange(false);
      reset();
      toast.success("BOM амжилттай шинэчлэгдлээ.");
    } catch (err) {
      capture(err, { context: "bom: updateBom UI" });
      setSubmitError("BOM шинэчлэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleClose() {
    onOpenChange(false);
    setSubmitError(null);
  }

  if (bomLoading) {
    return (
      <SlideInDrawer
        key={String(open)}
        open={open}
        onOpenChange={onOpenChange}
        title="BOM засах"
        description="Мэдээлэл ачаалж байна..."
        panelWidth="36rem"
      >
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
              key={i}
              className="h-10 w-full animate-pulse rounded bg-muted"
            />
          ))}
        </div>
      </SlideInDrawer>
    );
  }

  return (
    <SlideInDrawer
      key={String(open)}
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
      title="BOM засах"
      description={`${bom.name} засах`}
      panelWidth="36rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={handleClose} />
          <DrawerSubmit
            form="bom-edit-form"
            isPending={isSubmitting}
            label="Хадгалах"
            loadingLabel="Хадгалж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="bom-edit-form"
      >
        {submitError && <ErrorBanner error={submitError} />}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bom-edit-name">Нэр</FieldLabel>
            <Input
              id="bom-edit-name"
              placeholder="BOM нэр"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="bom-edit-notes">
              Тэмдэглэгээ{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Textarea
              id="bom-edit-notes"
              placeholder="Нэмэлт мэдээлэл..."
              {...register("notes")}
            />
          </Field>
        </FieldGroup>

        {/* BOM Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Материалууд</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  material_product_id: "",
                  quantity: 1,
                  unit: "ш",
                  required_width_mm: null,
                  required_length_mm: null,
                  required_thickness_mm: null,
                  estimated_unit_cost: 0,
                  notes: "",
                })
              }
            >
              <Plus className="mr-1 size-3" />
              Нэмэх
            </Button>
          </div>

          {errors.items && (
            <p className="text-xs text-destructive" role="alert">
              {errors.items.message ?? errors.items.root?.message}
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      aria-label={`${index + 1}-р материалыг устгах`}
                    >
                      <Trash className="size-3" />
                    </Button>
                  )}
                </div>

                <Controller
                  control={control}
                  name={`items.${index}.material_product_id`}
                  render={({ field: itemField }) => (
                    <div className="space-y-1">
                      <FieldLabel className="text-xs">Материал</FieldLabel>
                      <ProductPicker
                        products={products}
                        value={itemField.value || null}
                        onValueChange={(id) => itemField.onChange(id)}
                        placeholder="Материал сонгох..."
                      />
                      {errors.items?.[index]?.material_product_id && (
                        <p className="text-xs text-destructive" role="alert">
                          {errors.items[index]?.material_product_id?.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <FieldLabel className="text-xs">Тоо хэмжээ</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="text-sm"
                      {...register(`items.${index}.quantity`)}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <FieldLabel className="text-xs">Нэгж</FieldLabel>
                    <Input
                      placeholder="ш"
                      className="text-sm"
                      {...register(`items.${index}.unit`)}
                    />
                    {errors.items?.[index]?.unit && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.items[index]?.unit?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <FieldLabel className="text-xs">Нэгж өртөг</FieldLabel>
                    <Controller
                      control={control}
                      name={`items.${index}.estimated_unit_cost`}
                      render={({ field }) => (
                        <CurrencyInput
                          className="text-sm"
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <FieldLabel className="text-xs">Өргөн (мм)</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="заавал биш"
                      className="text-sm"
                      {...register(`items.${index}.required_width_mm`)}
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel className="text-xs">Урт (мм)</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="заавал биш"
                      className="text-sm"
                      {...register(`items.${index}.required_length_mm`)}
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel className="text-xs">Зузаан (мм)</FieldLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="заавал биш"
                      className="text-sm"
                      {...register(`items.${index}.required_thickness_mm`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </SlideInDrawer>
  );
}
