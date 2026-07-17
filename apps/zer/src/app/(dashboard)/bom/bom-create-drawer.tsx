"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { bomKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { createBom } from "./bom-actions";

const bomItemSchema = z.object({
  material_product_id: z.string().min(1, "Материал сонгоно уу"),
  quantity: z.coerce.number().min(0.01, "Тоо хэмжээ 0-ээ их байх ёстой"),
  unit: z.string().min(1, "Хэмжих нэгж шаардлагатай"),
  required_width_mm: z.coerce.number().optional().nullable(),
  required_length_mm: z.coerce.number().optional().nullable(),
  required_thickness_mm: z.coerce.number().optional().nullable(),
  estimated_unit_cost: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const bomSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  product_id: z.string().min(1, "Бүтээгдэхүүн сонгоно уу"),
  notes: z.string().optional().nullable(),
  items: z.array(bomItemSchema).min(1, "Дор хаяж нэг материал нэмнэ үү"),
});

type BomValues = z.infer<typeof bomSchema>;

interface ProductOption {
  id: string;
  name: string;
}

function useProducts() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: userData }) => {
      if (!userData?.user) return;
      supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userData.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile?.organization_id) return;
          supabase
            .from("products")
            .select("id, name")
            .eq("organization_id", profile.organization_id)
            .is("deleted_at", null)
            .order("name")
            .then(({ data, error }) => {
              if (error) capture(error);
              if (data) setProducts(data);
              setLoading(false);
            });
        });
    });
  }, []);

  return { products, loading };
}

export function BomCreateDrawer({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { products, loading: productsLoading } = useProducts();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BomValues>({
    resolver: zodResolver(bomSchema) as Resolver<BomValues>,
    defaultValues: {
      name: "",
      product_id: "",
      notes: "",
      items: [
        {
          material_product_id: "",
          quantity: 1,
          unit: "ш",
          required_width_mm: null,
          required_length_mm: null,
          required_thickness_mm: null,
          estimated_unit_cost: 0,
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: BomValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createBom({
        product_id: data.product_id,
        name: data.name,
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
      setOpen(false);
      reset();
      toast.success("BOM амжилттай үүсгэгдлээ.");
    } catch (err) {
      capture(err, { context: "bom: createBom UI" });
      setSubmitError("Бүтээгдэхүүний бүрэлдэхүүн үүсгэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleClose() {
    setOpen(false);
    reset();
    setSubmitError(null);
  }

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else setOpen(next);
      }}
      title="Шинэ BOM"
      description="Бүтээгдэхүүний бүрэлдэхүүн үүсгэх"
      panelWidth="36rem"
      modal={false}
      trigger={
        <DrawerFooter>
          <DrawerCancel onClick={handleClose} />
          <DrawerSubmit
            form="bom-create-form"
            isPending={isSubmitting}
            label="Үүсгэх"
            loadingLabel="Үүсгэж байна..."
          />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="bom-create-form"
      >
        {submitError && <ErrorBanner error={submitError} />}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bom-name">Нэр</FieldLabel>
            <Input
              id="bom-name"
              placeholder="Жишээ: Цахилгаан шүүр 1.0"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="bom-product">Бүтээгдэхүүн</FieldLabel>
            <Controller
              control={control}
              name="product_id"
              render={({ field }) => {
                const selected = products.find((p) => p.id === field.value);
                return (
                  <Combobox
                    items={products}
                    value={selected ?? null}
                    onValueChange={(next) => field.onChange(next?.id ?? "")}
                  >
                    <ComboboxInput
                      id="bom-product"
                      placeholder="Бүтээгдэхүүн сонгох..."
                      showTrigger
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {productsLoading
                          ? "Ачаалж байна..."
                          : "Бүтээгдэхүүн байхгүй"}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {(p: ProductOption) => (
                          <ComboboxItem key={p.id} value={p}>
                            {p.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                );
              }}
            />
            {errors.product_id && (
              <p className="text-xs text-destructive" role="alert">
                {errors.product_id.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="bom-notes">
              Тэмдэглэгээ{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Textarea
              id="bom-notes"
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
                  render={({ field: itemField }) => {
                    const selected = products.find(
                      (p) => p.id === itemField.value,
                    );
                    return (
                      <div className="space-y-1">
                        <FieldLabel className="text-xs">Материал</FieldLabel>
                        <Combobox
                          items={products}
                          value={selected ?? null}
                          onValueChange={(next) =>
                            itemField.onChange(next?.id ?? "")
                          }
                        >
                          <ComboboxInput
                            placeholder="Материал сонгох..."
                            showTrigger
                            className="text-sm"
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>
                              {productsLoading
                                ? "Ачаалж байна..."
                                : "Материал байхгүй"}
                            </ComboboxEmpty>
                            <ComboboxList>
                              {(p: ProductOption) => (
                                <ComboboxItem key={p.id} value={p}>
                                  {p.name}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {errors.items?.[index]?.material_product_id && (
                          <p className="text-xs text-destructive" role="alert">
                            {errors.items[index]?.material_product_id?.message}
                          </p>
                        )}
                      </div>
                    );
                  }}
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
                    <CurrencyInput
                      className="text-sm"
                      {...register(`items.${index}.estimated_unit_cost`)}
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
