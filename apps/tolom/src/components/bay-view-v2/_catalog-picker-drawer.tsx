"use client";

import { useLocale } from "next-intl";
import { DetailDrawer } from "@/components/ui/detail-drawer";
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
}: CatalogPickerDrawerProps<T>) {
  const locale = useLocale();
  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      hideBackdrop
      className="sm:max-w-[46rem] lg:max-w-[68rem] xl:max-w-[78rem]"
    >
      <DetailDrawer.Body className="p-0">
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
      </DetailDrawer.Body>
    </DetailDrawer>
  );
}
