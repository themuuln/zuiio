"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Barcode,
  Camera,
  NotePencil,
  Package,
  Tag,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { PRESET_CATEGORIES } from "@/lib/constants";
import {
  useProductVariants,
  useVariantGroups,
} from "@/lib/query/hooks/use-product-variants";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

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
  is_public?: boolean | null;
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
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  product: ProductEditData;
  brands?: { id: string; name: string; logo_url: string | null }[];
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(product.is_public ?? false);

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

  // Sync publication state when product changes
  useEffect(() => {
    setIsPublic(product.is_public ?? false);
  }, [product.is_public]);

  const handleBarcodeScan = (barcode: string) => {
    setValue("barcode", barcode);
    setIsBarcodeScannerOpen(false);
    return { found: true } as const;
  };

  const editMutation = useOptimisticUpdate({
    mutationFn: async (formData: FormData) => {
      const result = await updateProduct(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
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

  // Load existing variant groups and variant data via TanStack Query
  const { data: groupsData } = useVariantGroups(open ? product.id : undefined);
  const { data: variantsData } = useProductVariants(
    open ? product.id : undefined,
  );

  // Sync variant groups from query data
  useEffect(() => {
    if (groupsData === undefined) return;
    setVariantGroups(
      groupsData.map((g) => ({
        id: g.id,
        name: g.name,
        options: g.options.map((o) => ({ id: o.id, value: o.value })),
      })),
    );
  }, [groupsData]);

  // Sync variant data from query data
  useEffect(() => {
    if (variantsData === undefined) return;
    setVariantData(
      variantsData.map((v) => ({
        option_ids: v.option_ids,
        sku: v.sku ?? "",
        cost_price: v.cost_price ?? 0,
        sale_price: v.sale_price ?? 0,
        current_stock: v.current_stock ?? 0,
        image_url: v.image_urls?.[0] ?? null,
      })),
    );
  }, [variantsData]);

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
          image_url: null,
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
    if (isPublic) formData.append("is_public", "on");

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
    <SlideInDrawer
      open={open}
      onOpenChange={setOpen}
      title="\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u04af\u04af\u043d\u0438\u0439\u043d \u0437\u0430\u0441\u0430\u0445"
      description={product.name}
      trigger={
        children ? (
          <span className="w-full">{children}</span>
        ) : (
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          >
            <NotePencil className="size-3.5" />
          </button>
        )
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={buttonVariants({
              variant: "outline",
            })}
          >
            Цуцлах
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={editMutation.isPending}
            className={buttonVariants({ variant: "default" })}
          >
            Хадгалах
          </button>
        </div>
      }
    >
      <form
        id="edit-product-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative space-y-5"
      >
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
              <FieldLabel htmlFor="edit-category_name">Ангилал</FieldLabel>
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
                  (brands ?? []).find((b) => b.id === selectedBrandId) ?? null
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
              <FieldLabel htmlFor="edit-cost_price">Өртөг үнэ</FieldLabel>
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
              <FieldLabel htmlFor="edit-sale_price">Зарах үнэ</FieldLabel>
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

        <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="edit-is_public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <label
              htmlFor="edit-is_public"
              className="text-sm font-medium leading-none"
            >
              Нийтийн каталогт нийтлэх
            </label>
          </div>
          <p className="mt-1.5 ml-7 text-xs text-muted-foreground">
            Нийтэлбэл бүтээгдэхүүний нэр, зураг, үнэ, тайлбар нийтийн хуудаснаа
            харагдана. Нөөц, SKU, өртөг үнэ нууц хэвээр үлдэнэ.
          </p>
          {isPublic && product.id && (
            <Link
              href={`/products/${product.id}`}
              target="_blank"
              className="ml-7 mt-1.5 inline-block text-xs text-primary hover:underline"
            >
              Нийтийн хуудас харах →
            </Link>
          )}
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
          inline
        />

        <VariantSummaryCard groups={variantGroups} variantData={variantData} />

        {editMutation.error ? (
          <div className="rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {editMutation.error.message}
          </div>
        ) : null}
      </form>

      {isBarcodeScannerOpen && (
        <CameraScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsBarcodeScannerOpen(false)}
        />
      )}
    </SlideInDrawer>
  );
}
