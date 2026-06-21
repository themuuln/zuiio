"use client";

import { Barcode, Camera, Package, Tag } from "@phosphor-icons/react";
import Image from "next/image";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { useBrands } from "@/lib/query/hooks/use-brands";
import { UNIT_GROUPS } from "./product-types";

// ─── Barcode Input (with camera scanner) ──────────────────────────────

type BarcodeInputFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  label?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Called when user wants to open the barcode camera scanner */
  onOpenScanner?: () => void;
};

export function BarcodeInputField({
  value,
  onChange,
  error,
  label = "Barcode",
  id = "barcode",
  placeholder = "8654...",
  disabled,
  onOpenScanner,
}: BarcodeInputFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Barcode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            className="pl-9"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
          />
        </div>
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border-2 border-dashed bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Камераар скан хийх"
          >
            <Camera className="size-5" weight="bold" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

// ─── Product Name Input ───────────────────────────────────────────────

type ProductNameFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function ProductNameField({
  value,
  onChange,
  error,
  id = "name",
  placeholder = "Цай 500гр",
  disabled,
}: ProductNameFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Нэр</FieldLabel>
      <div className="relative">
        <Package className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          required
          className="pl-9"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

// ─── SKU Input ────────────────────────────────────────────────────────

type SkuFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function SkuField({
  value,
  onChange,
  error,
  id = "sku",
  placeholder = "TEA-500",
  disabled,
}: SkuFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>SKU</FieldLabel>
      <div className="relative">
        <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          className="pl-9"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

// ─── Unit Select ──────────────────────────────────────────────────────

type UnitSelectFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  id?: string;
};

export function UnitSelectField({
  value,
  onChange,
  error,
  id = "unit",
}: UnitSelectFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Нэгж</FieldLabel>
      <CreatableCombobox
        name={id}
        id={id}
        placeholder="ширхэг"
        initialItems={[...UNIT_GROUPS]}
        value={value ?? ""}
        onChange={(next) => onChange?.(next)}
        emptyLabel="Нэгж байхгүй"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

// ─── Category Select ──────────────────────────────────────────────────

type CategorySelectFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  id?: string;
  companyType?: string;
};

export function CategorySelectField({
  value,
  onChange,
  error,
  id = "category_name",
  companyType,
}: CategorySelectFieldProps) {
  const presets = companyType
    ? (PRESET_CATEGORIES[companyType] ?? [])
    : [...new Set(Object.values(PRESET_CATEGORIES).flat())];

  return (
    <Field>
      <FieldLabel htmlFor={id}>Ангилал</FieldLabel>
      <CreatableCombobox
        name={id}
        id={id}
        placeholder="Ангилал сонгох эсвэл бичих"
        initialItems={presets}
        value={value ?? ""}
        onChange={(next) => onChange?.(next)}
        emptyLabel="Ангилал байхгүй"
      />
      <FieldDescription>
        Байгууллагын төрөлд тохирсон ангиллууд санал болгогдоно. Шинэ нэр
        оруулбал автоматаар үүсгэнэ.
      </FieldDescription>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

// ─── Brand Select ─────────────────────────────────────────────────────

type BrandSelectFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  organizationId?: string;
  id?: string;
};

export function BrandSelectField({
  value,
  onChange,
  organizationId,
  id = "brand_id",
}: BrandSelectFieldProps) {
  const { data: brands } = useBrands(organizationId ?? "");

  const brandItems: { id: string; name: string; logo_url: string | null }[] =
    brands ?? [];

  return (
    <Field>
      <FieldLabel htmlFor={id}>Брэнд</FieldLabel>
      <Combobox
        name={id}
        items={brandItems}
        value={brandItems.find((b) => b.id === value) ?? null}
        onValueChange={(
          next: { id: string; name: string; logo_url: string | null } | null,
        ) => onChange?.(next?.id ?? "")}
        itemToStringLabel={(item) => item?.name ?? ""}
        inputValue={brandItems.find((b) => b.id === value)?.name ?? ""}
        onInputValueChange={() => {}}
      >
        <ComboboxInput
          id={id}
          placeholder="Брэнд сонгох"
          showTrigger
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>Брэнд байхгүй</ComboboxEmpty>
          <ComboboxList>
            {(item: { id: string; name: string; logo_url: string | null }) => (
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
  );
}

// ─── Price (Currency) Input ───────────────────────────────────────────

type PriceFieldProps = {
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
  label: string;
  id?: string;
  disabled?: boolean;
};

export function PriceField({
  value,
  onChange,
  error,
  label,
  id,
  disabled,
}: PriceFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <CurrencyInput
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

// ─── Stock (number) Input ─────────────────────────────────────────────

type StockFieldProps = {
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
  label: string;
  id?: string;
  min?: number;
  step?: number;
  disabled?: boolean;
};

export function StockField({
  value,
  onChange,
  error,
  label,
  id,
  min = 0,
  step = 0.01,
  disabled,
}: StockFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange?.(Number(e.target.value))}
        disabled={disabled}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}
