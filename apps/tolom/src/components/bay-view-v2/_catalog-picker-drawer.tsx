"use client";

import { useLocale } from "next-intl";
import { PickerDrawer } from "@/components/ui/picker-drawer";
import type { CatalogItem } from "./_catalog-combobox";
import { CatalogCombobox } from "./_catalog-combobox";

interface CatalogPickerDrawerProps<T extends CatalogItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: T) => void;
  onAddNew: (name: string) => void;
  isAdded: (item: T) => boolean;
  placeholder: string;
  noMatchMessage: string;
  addAsNewLabel: string;
  filterAllLabel: string;
  title: string;
  description?: string;
}

export function CatalogPickerDrawer<T extends CatalogItem>({
  open,
  onOpenChange,
  items,
  search,
  onSearchChange,
  onSelect,
  onAddNew,
  isAdded,
  placeholder,
  noMatchMessage,
  addAsNewLabel,
  filterAllLabel,
  title,
  description,
}: CatalogPickerDrawerProps<T>) {
  const locale = useLocale();
  return (
    <PickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <CatalogCombobox
        items={items}
        search={search}
        onSearchChange={onSearchChange}
        onSelect={onSelect}
        onAddNew={onAddNew}
        isAdded={isAdded}
        placeholder={placeholder}
        noMatchMessage={noMatchMessage}
        addAsNewLabel={addAsNewLabel}
        locale={locale}
        resultsMode="inline"
        filterAllLabel={filterAllLabel}
      />
    </PickerDrawer>
  );
}
