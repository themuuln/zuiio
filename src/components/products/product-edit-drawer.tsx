"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, NotePencil, Package, Tag } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateProduct } from "@/app/(dashboard)/products/actions";
import {
  DrawerFooter,
  DrawerCancel,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import {
  computeCombinations,
  type LocalVariantData,
  type LocalVariantGroup,
  VariantManagerDrawer,
} from "@/components/products/variant-manager-drawer";
import { buttonVariants } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { ErrorBanner } from "@/components/ui/error-banner";
import { createClient } from "@/lib/supabase/client";

export interface ProductEditData {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  category_name: string | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
}

// Collect all preset categories across all company types
const allPresetCategories = [
  ...new Set(Object.values(PRESET_CATEGORIES).flat()),
];

const initialUnits = [
  "ширхэг",
  "кг",
  "гр",
  "л",
  "мл",
  "м",
  "см",
  "уут",
  "хайрцаг",
  "багц",
  "хос",
  "ш",
];

const initialCategoryNames = allPresetCategories;

const productEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  sku: z.string(),
  barcode: z.string(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  min_stock: z.number().min(0),
});

type ProductEditValues = z.infer<typeof productEditSchema>;

export function ProductEditDrawer({
  product,
  brands,
  children,
}: {
  product: ProductEditData;
  brands?: { id: string; name: string; logo_url: string | null }[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const [selectedUnit, setSelectedUnit] = useState<string | null>(
    product.unit ?? "ширхэг",
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    product.category_name ?? "",
  );
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    product.brand_id ?? "",
  );

  const [variantGroups, setVariantGroups] = useState<LocalVariantGroup[]>([]);
  const [variantData, setVariantData] = useState<LocalVariantData[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product.name,
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      cost_price: product.cost_price ?? 0,
      sale_price: product.sale_price ?? 0,
      min_stock: product.min_stock ?? 0,
    },
  });

  const editMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateProduct(undefined, formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: productKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
    buildOptimistic: (formData) => ({
      name: formData.get("name")?.toString() ?? "",
      sku: formData.get("sku")?.toString() || null,
      barcode: formData.get("barcode")?.toString() || null,
      unit: formData.get("unit")?.toString() ?? "ширхэг",
      category_name: formData.get("category_name")?.toString() || null,
      brand_id: formData.get("brand_id")?.toString() || null,
      cost_price: Number(formData.get("cost_price") ?? 0),
      sale_price: Number(formData.get("sale_price") ?? 0),
      min_stock: Number(formData.get("min_stock") ?? 0),
    }),
  });

  // Load existing variant groups and variant data when drawer opens
  useEffect(() => {
    if (!open) return;
    const loadExistingVariants = async () => {
      const supabase = createClient();
      const { data: groups } = await supabase
        .from("product_variant_groups")
        .select("id, name, sort_order")
        .eq("product_id", product.id)
        .order("sort_order");

      if (!groups || groups.length === 0) {
        setVariantGroups([]);
        setVariantData([]);
        return;
      }

      const loadedGroups: LocalVariantGroup[] = [];
      for (const group of groups) {
        const { data: options } = await supabase
          .from("product_variant_options")
          .select("id, value")
          .eq("group_id", group.id)
          .order("sort_order");

        loadedGroups.push({
          id: group.id,
          name: group.name,
          options: (options ?? []).map((o) => ({ id: o.id, value: o.value })),
        });
      }
      setVariantGroups(loadedGroups);

      // Load existing variant data (SKU, prices, stock)
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, sku, cost_price, sale_price, current_stock")
        .eq("product_id", product.id);

      if (variants && variants.length > 0) {
        const loadedVariantData: LocalVariantData[] = [];
        for (const v of variants) {
          const { data: assigns } = await supabase
            .from("product_variant_assignments")
            .select("option_id")
            .eq("variant_id", v.id);

          const optionIds = assigns?.map((a) => a.option_id) ?? [];
          loadedVariantData.push({
            option_ids: optionIds,
            sku: v.sku ?? "",
            cost_price: v.cost_price ?? 0,
            sale_price: v.sale_price ?? 0,
            current_stock: v.current_stock ?? 0,
          });
        }
        setVariantData(loadedVariantData);
      }
    };
    loadExistingVariants();
  }, [open, product.id]);

  const watchedCostPrice = watch("cost_price");
  const watchedSalePrice = watch("sale_price");

  // Initialize variant data for any new combinations when groups change
  useEffect(() => {
    if (variantGroups.length === 0) return;
    const combos = computeCombinations(variantGroups);
    setVariantData((prev) => {
      const prevMap = new Map(prev.map((d) => [d.option_ids.join("-"), d]));
      return combos.map((combo) => {
        const key = combo.option_ids.join("-");
        const existing = prevMap.get(key);
        if (existing) return existing;
        return {
          option_ids: combo.option_ids,
          sku: "",
          cost_price: watchedCostPrice ?? 0,
          sale_price: watchedSalePrice ?? 0,
          current_stock: 0,
        };
      });
    });
  }, [variantGroups, watchedCostPrice, watchedSalePrice]);

  const hasVariants = variantGroups.length > 0;

  const onSubmit = (data: ProductEditValues) => {
    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("name", data.name);
    formData.append("sku", data.sku);
    formData.append("barcode", data.barcode);
    formData.append("unit", selectedUnit ?? "ширхэг");
    formData.append("category_name", selectedCategory ?? "");
    formData.append("brand_id", selectedBrandId ?? "");
    formData.append("cost_price", String(data.cost_price));
    formData.append("sale_price", String(data.sale_price));
    formData.append("min_stock", String(data.min_stock));

    // Attach variant data from state
    if (hasVariants) {
      formData.append("variant_groups", JSON.stringify(variantGroups));
      formData.append("variant_data", JSON.stringify(variantData));
    }

    editMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Бүтээгдэхүүн амжилттай шинэчлэгдлээ.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        children ?? (
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          >
            <NotePencil className="size-3.5" />
          </button>
        )
      }
    >
      <DrawerHeader title="Бүтээгдэхүүн засах" description={product.name} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex-1 overflow-y-auto space-y-5">
          <div className="grid gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-name">Нэр</FieldLabel>
                <div className="relative">
                  <Package className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-name"
                    className="pl-9"
                    placeholder="Цай 500гр"
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-sku">SKU</FieldLabel>
                <div className="relative">
                  <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-sku"
                    className="pl-9"
                    placeholder="TEA-500"
                    {...register("sku")}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-barcode">Barcode</FieldLabel>
                <div className="relative">
                  <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-barcode"
                    className="pl-9"
                    placeholder="8654..."
                    {...register("barcode")}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-unit">Нэгж</FieldLabel>
                <CreatableCombobox
                  name="unit"
                  id="edit-unit"
                  placeholder="ширхэг"
                  initialItems={initialUnits}
                  value={selectedUnit ?? "ширхэг"}
                  onChange={(next) => setSelectedUnit(next)}
                  emptyLabel="Нэгж байхгүй"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-category_name">Ангилал</FieldLabel>
                <CreatableCombobox
                  name="category_name"
                  id="edit-category_name"
                  placeholder="Ундаа, хүнс, ахуйн бараа"
                  initialItems={initialCategoryNames}
                  value={selectedCategory ?? ""}
                  onChange={(next) => setSelectedCategory(next)}
                  emptyLabel="Ангилал байхгүй"
                />
                <FieldDescription>
                  Шинэ нэр оруулбал ангиллыг автоматаар үүсгэнэ.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-brand_id">Брэнд</FieldLabel>
                <Combobox
                  name="brand_id"
                  items={
                    (brands ?? []) as {
                      id: string;
                      name: string;
                      logo_url: string | null;
                    }[]
                  }
                  defaultValue={product.brand_id ?? ""}
                  onValueChange={(
                    next: {
                      id: string;
                      name: string;
                      logo_url: string | null;
                    } | null,
                  ) => setSelectedBrandId(next?.id ?? "")}
                  itemToStringLabel={(item) => item?.name ?? ""}
                  inputValue={
                    brands?.find((b) => b.id === selectedBrandId)?.name ?? ""
                  }
                  onInputValueChange={() => {}}
                >
                  <ComboboxInput
                    id="edit-brand_id"
                    placeholder="Брэнд сонгох"
                    showTrigger
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Брэнд байхгүй</ComboboxEmpty>
                    <ComboboxList>
                      {(item: {
                        id: string;
                        name: string;
                        logo_url: string | null;
                      }) => (
                        <ComboboxItem key={item.id} value={item.id}>
                          {item.logo_url ? (
                            <img
                              src={item.logo_url}
                              alt={item.name}
                              className="mr-2 inline-block size-4 rounded object-contain dark:invert"
                            />
                          ) : null}
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="edit-cost_price">Өртөг үнэ</FieldLabel>
                <Input
                  id="edit-cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("cost_price", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-sale_price">Зарах үнэ</FieldLabel>
                <Input
                  id="edit-sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("sale_price", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-min_stock">Доод үлдэгдэл</FieldLabel>
                <Input
                  id="edit-min_stock"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("min_stock", { valueAsNumber: true })}
                />
              </Field>
            </FieldGroup>
          </div>

          <VariantManagerDrawer
            groups={variantGroups}
            onGroupsChange={setVariantGroups}
            defaultValues={{
              cost_price: watchedCostPrice ?? 0,
              sale_price: watchedSalePrice ?? 0,
              current_stock: 0,
            }}
            variantData={variantData}
            onVariantsChange={setVariantData}
          />
        </div>

        <ErrorBanner error={editMutation.error} />

        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit isPending={editMutation.isPending} label="Хадгалах" />
        </DrawerFooter>
      </form>
    </DrawerLayout>
  );
}
