"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Barcode, Camera, Package, Plus, Tag } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useOrgSettings } from "@/lib/org-settings-context";

const CameraScanner = dynamic(
  () => import("@/components/shop/camera-scanner").then((m) => m.CameraScanner),
  { ssr: false },
);

import { z } from "zod";
import { createProduct } from "@/app/(dashboard)/products/new/actions";
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
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { useBrands } from "@/lib/query/hooks/use-brands";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

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

const productSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, "Нэгж шаардлагатай"),
  category_name: z.string().optional(),
  brand_id: z.string().optional(),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  current_stock: z.number().min(0),
  min_stock: z.number().min(0),
});

type ProductValues = z.infer<typeof productSchema>;

export function ProductCreateDrawer({
  companyType,
  organizationId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  companyType: string;
  organizationId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const presets = companyType
    ? (PRESET_CATEGORIES[companyType] ?? [])
    : [...new Set(Object.values(PRESET_CATEGORIES).flat())];
  const { data: brands } = useBrands(organizationId ?? "");
  const { hasVariants, hasBrands, hasCategories } = useOrgSettings();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      unit: "ширхэг",
      category_name: "",
      brand_id: "",
      cost_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
    },
  });

  const handleBarcodeScan = (barcode: string) => {
    setValue("barcode", barcode);
    setIsBarcodeScannerOpen(false);
    return { found: true } as const;
  };

  const [variantGroups, setVariantGroups] = useState<LocalVariantGroup[]>([]);
  const [variantData, setVariantData] = useState<LocalVariantData[]>([]);

  const watchedCostPrice = watch("cost_price");
  const watchedSalePrice = watch("sale_price");
  const watchedCurrentStock = watch("current_stock");

  // Initialize variant data when groups change
  useEffect(() => {
    if (variantGroups.length === 0) {
      setVariantData([]);
      return;
    }
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
          current_stock: watchedCurrentStock ?? 0,
          image_url: null,
        };
      });
    });
  }, [variantGroups, watchedCostPrice, watchedSalePrice, watchedCurrentStock]);

  const productMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createProduct(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return result;
    },
    queryKey: productKeys.all,
    buildOptimistic: (formData) => {
      const brandId = formData.get("brand_id")?.toString() ?? "";
      const selectedBrand = brands?.find((b) => b.id === brandId);
      return {
        id: `opt-${Date.now()}`,
        name: formData.get("name")?.toString() ?? "",
        sku: formData.get("sku")?.toString() || null,
        barcode: formData.get("barcode")?.toString() || null,
        unit: formData.get("unit")?.toString() ?? "ширхэг",
        category_name: formData.get("category_name")?.toString() || null,
        brand_id: brandId || null,
        brand_name: selectedBrand?.name ?? null,
        brand_logo_url: selectedBrand?.logo_url ?? null,
        cost_price: Number(formData.get("cost_price") ?? 0),
        sale_price: Number(formData.get("sale_price") ?? 0),
        current_stock: Number(formData.get("current_stock") ?? 0),
        min_stock: Number(formData.get("min_stock") ?? 0),
        created_at: new Date().toISOString(),
      };
    },
  });

  const onSubmit = (data: ProductValues) => {
    if (productMutation.isPending) return;
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("sku", data.sku ?? "");
    formData.append("barcode", data.barcode ?? "");
    formData.append("unit", data.unit);
    formData.append("category_name", data.category_name ?? "");
    formData.append("brand_id", data.brand_id ?? "");
    formData.append("cost_price", String(data.cost_price));
    formData.append("sale_price", String(data.sale_price));
    formData.append("current_stock", String(data.current_stock));
    formData.append("min_stock", String(data.min_stock));

    // Attach variant data from state
    if (hasVariants) {
      formData.append("variant_groups", JSON.stringify(variantGroups));
      formData.append("variant_data", JSON.stringify(variantData));
    }

    productMutation.mutate(formData, { onSuccess: () => setOpen(false) });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" />
          Шинэ бүтээгдэхүүн
        </button>
      }
      title="Шинэ бүтээгдэхүүн"
      description="Каталогтоо бараа нэмээд шууд агуулах болон борлуулалтын урсгалд ашиглана."
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="product-form"
            isPending={productMutation.isPending}
            data-testid="create-product-submit"
          />
        </DrawerFooter>
      }
    >
      <form
        id="product-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative"
      >
        <div className="space-y-5">
          <div className="grid gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Нэр</FieldLabel>
                <div className="relative">
                  <Package className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    required
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
                <FieldLabel htmlFor="sku">SKU</FieldLabel>
                <div className="relative">
                  <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sku"
                    className="pl-9"
                    placeholder="TEA-500"
                    {...register("sku")}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="barcode"
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
                <FieldLabel htmlFor="unit">Нэгж</FieldLabel>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <CreatableCombobox
                      name="unit"
                      id="unit"
                      placeholder="ширхэг"
                      initialItems={unitGroups}
                      value={field.value ?? ""}
                      onChange={(next) => field.onChange(next)}
                      emptyLabel="Нэгж байхгүй"
                    />
                  )}
                />
                {errors.unit && (
                  <p className="text-xs text-destructive">
                    {errors.unit.message}
                  </p>
                )}
              </Field>
              {hasCategories && (
                <Field>
                  <FieldLabel htmlFor="category_name">Ангилал</FieldLabel>
                  <Controller
                    name="category_name"
                    control={control}
                    render={({ field }) => (
                      <CreatableCombobox
                        name="category_name"
                        id="category_name"
                        placeholder="Ангилал сонгох эсвэл бичих"
                        initialItems={presets}
                        value={field.value ?? ""}
                        onChange={(next) => field.onChange(next)}
                        emptyLabel="Ангилал байхгүй"
                      />
                    )}
                  />
                  <FieldDescription>
                    Байгууллагын төрөлд тохирсон ангиллууд санал болгогдоно.
                    Шинэ нэр оруулбал автоматаар үүсгэнэ.
                  </FieldDescription>
                  {errors.category_name && (
                    <p className="text-xs text-destructive">
                      {errors.category_name.message}
                    </p>
                  )}
                </Field>
              )}
              {hasBrands && (
                <Field>
                  <FieldLabel htmlFor="brand_id">Брэнд</FieldLabel>
                  <Controller
                    name="brand_id"
                    control={control}
                    render={({ field }) => {
                      const brandItems: {
                        id: string;
                        name: string;
                        logo_url: string | null;
                      }[] = brands ?? [];
                      const selectedBrand = brandItems.find(
                        (b) => b.id === field.value,
                      );
                      return (
                        <Combobox
                          name="brand_id"
                          items={brandItems}
                          value={
                            brandItems.find((b) => b.id === field.value) ?? null
                          }
                          onValueChange={(
                            next: {
                              id: string;
                              name: string;
                              logo_url: string | null;
                            } | null,
                          ) => field.onChange(next?.id ?? "")}
                          itemToStringLabel={(item) => item?.name ?? ""}
                          inputValue={selectedBrand?.name ?? ""}
                          onInputValueChange={() => {}}
                        >
                          <ComboboxInput
                            id="brand_id"
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
                      );
                    }}
                  />
                </Field>
              )}
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="cost_price">Өртөг үнэ</FieldLabel>
                <Controller
                  control={control}
                  name="cost_price"
                  render={({ field }) => (
                    <CurrencyInput
                      id="cost_price"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sale_price">Зарах үнэ</FieldLabel>
                <Controller
                  control={control}
                  name="sale_price"
                  render={({ field }) => (
                    <CurrencyInput
                      id="sale_price"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="current_stock">Эхний үлдэгдэл</FieldLabel>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("current_stock", {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="min_stock">Доод үлдэгдэл</FieldLabel>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("min_stock", { valueAsNumber: true })}
                />
              </Field>
            </FieldGroup>
          </div>

          {hasVariants && (
            <>
              <VariantManagerDrawer
                groups={variantGroups}
                onGroupsChange={setVariantGroups}
                defaultValues={{
                  cost_price: watchedCostPrice ?? 0,
                  sale_price: watchedSalePrice ?? 0,
                  current_stock: watchedCurrentStock ?? 0,
                }}
                variantData={variantData}
                onVariantsChange={setVariantData}
                parentTitle="Шинэ бүтээгдэхүүн"
                inline
              />

              <VariantSummaryCard
                groups={variantGroups}
                variantData={variantData}
              />
            </>
          )}
        </div>

        <ErrorBanner error={productMutation.error} />
      </form>

      {isBarcodeScannerOpen && (
        <CameraScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsBarcodeScannerOpen(false)}
        />
      )}
    </DrawerLayout>
  );
}
