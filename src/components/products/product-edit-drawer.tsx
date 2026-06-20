"use client";

import { Drawer } from "@base-ui/react/drawer";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Barcode,
  Camera,
  NotePencil,
  Package,
  Tag,
  X,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateProduct } from "@/app/(dashboard)/products/actions";
import {
  computeCombinations,
  type LocalVariantData,
  type LocalVariantGroup,
  VariantManagerDrawer,
  VariantSummaryCard,
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
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { createClient } from "@/lib/supabase/client";

const CameraScanner = dynamic(
  () => import("@/components/shop/camera-scanner").then((m) => m.CameraScanner),
  { ssr: false },
);

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

const unitGroups = [
  {
    label: "Нийтлэг",
    items: ["ширхэг", "кг", "гр", "л", "мл"] as const,
  },
  {
    label: "Бусад",
    items: ["м", "см", "уут", "хайрцаг", "багц", "хос", "ш"] as const,
  },
];
const initialUnits = unitGroups.flatMap((g) => g.items);

const initialCategoryNames = allPresetCategories;

const productEditSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  sku: z.string(),
  barcode: z.string(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  current_stock: z.number().min(0),
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
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  // --- Unit combobox (creatable) ---
  const [unitQuery, setUnitQuery] = useState(product.unit ?? "ширхэг");
  const trimmedUnitQuery = unitQuery.trim();
  const loweredUnitQuery = trimmedUnitQuery.toLowerCase();
  const [allUnits, setAllUnits] = useState<string[]>([...initialUnits]);
  const filteredUnits = loweredUnitQuery
    ? allUnits.filter((u) => u.toLowerCase().includes(loweredUnitQuery))
    : allUnits;
  const unitItems: string[] =
    trimmedUnitQuery !== "" && filteredUnits.length === 0
      ? [unitQuery.trim()]
      : filteredUnits;
  const [selectedUnit, setSelectedUnit] = useState<string | null>(
    product.unit ?? "ширхэг",
  );

  // --- Category combobox (creatable) ---
  const [categoryQuery, setCategoryQuery] = useState(
    product.category_name ?? "",
  );
  const trimmedCategoryQuery = categoryQuery.trim();
  const loweredCategoryQuery = trimmedCategoryQuery.toLowerCase();
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([
    ...initialCategoryNames,
  ]);
  const filteredCategories = loweredCategoryQuery
    ? allCategoryNames.filter((c) =>
        c.toLowerCase().includes(loweredCategoryQuery),
      )
    : allCategoryNames;
  const categoryItems: string[] =
    trimmedCategoryQuery !== "" && filteredCategories.length === 0
      ? [categoryQuery.trim()]
      : filteredCategories;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    product.category_name ?? "",
  );
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    product.brand_id ?? "",
  );
  const [brandQuery, setBrandQuery] = useState(
    (brands ?? []).find((b) => b.id === product.brand_id)?.name ?? "",
  );

  const [variantGroups, setVariantGroups] = useState<LocalVariantGroup[]>([]);
  const [variantData, setVariantData] = useState<LocalVariantData[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product.name,
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      cost_price: product.cost_price ?? 0,
      sale_price: product.sale_price ?? 0,
      current_stock: product.current_stock ?? 0,
      min_stock: product.min_stock ?? 0,
    },
  });

  // Reset form when product changes
  useEffect(() => {
    reset({
      name: product.name,
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      cost_price: product.cost_price ?? 0,
      sale_price: product.sale_price ?? 0,
      current_stock: product.current_stock ?? 0,
      min_stock: product.min_stock ?? 0,
    });
  }, [
    reset,
    product.name,
    product.sku,
    product.barcode,
    product.cost_price,
    product.sale_price,
    product.current_stock,
    product.min_stock,
  ]);

  // Sync combobox state when product changes
  useEffect(() => {
    setUnitQuery(product.unit ?? "ширхэг");
    setSelectedUnit(product.unit ?? "ширхэг");
    setCategoryQuery(product.category_name ?? "");
    setSelectedCategory(product.category_name ?? "");
    setSelectedBrandId(product.brand_id ?? "");
    setBrandQuery(
      (brands ?? []).find((b) => b.id === product.brand_id)?.name ?? "",
    );
  }, [product.unit, product.category_name, product.brand_id, brands]);

  const handleBarcodeScan = (barcode: string) => {
    setValue("barcode", barcode);
    setIsBarcodeScannerOpen(false);
    return { found: true } as const;
  };

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
    formData.append("current_stock", String(data.current_stock));
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
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      {children ? (
        <Drawer.Trigger className="w-full">{children}</Drawer.Trigger>
      ) : (
        <Drawer.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
        >
          <NotePencil className="size-3.5" />
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.1] z-40 [--bleed:3rem] dark:[--backdrop-opacity:0.4] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] z-50 supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    Бүтээгдэхүүн засах
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {product.name}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="edit-barcode"
                            className="pl-9"
                            placeholder="8654..."
                            {...register("barcode")}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsBarcodeScannerOpen(true)}
                          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border-2 border-dashed bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          title="Камераар скан хийх"
                        >
                          <Camera className="size-5" weight="bold" />
                        </button>
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-unit">Нэгж</FieldLabel>
                      <Combobox
                        name="unit"
                        items={unitItems}
                        defaultValue={product.unit ?? "ширхэг"}
                        onValueChange={(next: string | null) => {
                          if (next && !allUnits.includes(next)) {
                            setAllUnits((prev) => [...prev, next]);
                          }
                          setUnitQuery(next ?? "");
                          setSelectedUnit(next);
                        }}
                        itemToStringLabel={(item: string | null) =>
                          item
                            ? allUnits.includes(item)
                              ? item
                              : `"${item}" үүсгэх`
                            : ""
                        }
                        inputValue={unitQuery}
                        onInputValueChange={setUnitQuery}
                      >
                        <ComboboxInput
                          id="edit-unit"
                          placeholder="ширхэг"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>Нэгж байхгүй</ComboboxEmpty>
                          <ComboboxList
                            groups={loweredUnitQuery ? undefined : unitGroups}
                          >
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {allUnits.includes(item) ||
                                (initialUnits as string[]).includes(item)
                                  ? item
                                  : `"${item}" үүсгэх`}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-category_name">
                        Ангилал
                      </FieldLabel>
                      <Combobox
                        name="category_name"
                        items={categoryItems}
                        defaultValue={product.category_name ?? ""}
                        onValueChange={(next: string | null) => {
                          if (next && !allCategoryNames.includes(next)) {
                            setAllCategoryNames((prev) => [...prev, next]);
                          }
                          setCategoryQuery(next ?? "");
                          setSelectedCategory(next);
                        }}
                        itemToStringLabel={(item: string | null) =>
                          item
                            ? allCategoryNames.includes(item)
                              ? item
                              : `"${item}" үүсгэх`
                            : ""
                        }
                        inputValue={categoryQuery}
                        onInputValueChange={setCategoryQuery}
                      >
                        <ComboboxInput
                          id="edit-category_name"
                          placeholder="Ундаа, хүнс, ахуйн бараа"
                          showTrigger
                          className="w-full"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>Ангилал байхгүй</ComboboxEmpty>
                          <ComboboxList>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {allCategoryNames.includes(item) ||
                                initialCategoryNames.includes(item)
                                  ? item
                                  : `"${item}" үүсгэх`}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
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
                        value={
                          (brands ?? []).find(
                            (b) => b.id === selectedBrandId,
                          ) ?? null
                        }
                        onValueChange={(
                          next: {
                            id: string;
                            name: string;
                            logo_url: string | null;
                          } | null,
                        ) => {
                          setSelectedBrandId(next?.id ?? "");
                          setBrandQuery(next?.name ?? "");
                        }}
                        itemToStringLabel={(item) => item?.name ?? ""}
                        inputValue={brandQuery}
                        onInputValueChange={setBrandQuery}
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
                                  <Image
                                    src={item.logo_url}
                                    alt={item.name}
                                    width={16}
                                    height={16}
                                    unoptimized
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
                      <FieldLabel htmlFor="edit-cost_price">
                        Өртөг үнэ
                      </FieldLabel>
                      <Controller
                        control={control}
                        name="cost_price"
                        render={({ field }) => (
                          <CurrencyInput
                            id="edit-cost_price"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-sale_price">
                        Зарах үнэ
                      </FieldLabel>
                      <Controller
                        control={control}
                        name="sale_price"
                        render={({ field }) => (
                          <CurrencyInput
                            id="edit-sale_price"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-current_stock">
                        Одоогийн үлдэгдэл
                      </FieldLabel>
                      <Input
                        id="edit-current_stock"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("current_stock", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="edit-min_stock">
                        Доод үлдэгдэл
                      </FieldLabel>
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
                  parentTitle="Бүтээгдэхүүн засах"
                />

                <VariantSummaryCard
                  groups={variantGroups}
                  variantData={variantData}
                />

                {editMutation.error ? (
                  <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {editMutation.error.message}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3">
                  <Drawer.Close
                    className={buttonVariants({
                      variant: "outline",
                    })}
                  >
                    Цуцлах
                  </Drawer.Close>
                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                    className={buttonVariants({ variant: "default" })}
                  >
                    Хадгалах
                  </button>
                </div>
              </form>

              {isBarcodeScannerOpen && (
                <CameraScanner
                  onScan={handleBarcodeScan}
                  onClose={() => setIsBarcodeScannerOpen(false)}
                />
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
