"use client";

import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import type { CatalogItem } from "./_catalog-combobox";
import { CatalogCombobox } from "./_catalog-combobox";

interface CatalogPickerDrawerProps<T extends CatalogItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: T[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: T) => void;
  onAddNew: (name: string) => void;
  isAdded: (item: T) => boolean;
  placeholder: string;
  noMatchMessage: string;
  addAsNewLabel: string;
  closeLabel: string;
  filterAllLabel: string;
}

export function CatalogPickerDrawer<T extends CatalogItem>({
  open,
  onOpenChange,
  title,
  description,
  items,
  search,
  onSearchChange,
  onSelect,
  onAddNew,
  isAdded,
  placeholder,
  noMatchMessage,
  addAsNewLabel,
  closeLabel,
  filterAllLabel,
}: CatalogPickerDrawerProps<T>) {
  const locale = useLocale();

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      size="5xl"
      backdropForceRender
    >
      <DetailDrawer.Header
        actions={
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        }
      >
        <DetailDrawer.Title className="text-2xl tracking-tight">
          {title}
        </DetailDrawer.Title>
        <DetailDrawer.Description className="max-w-2xl text-base leading-7 text-muted-foreground/85">
          {description}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

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
