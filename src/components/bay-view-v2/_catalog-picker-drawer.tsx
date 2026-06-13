"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
}: CatalogPickerDrawerProps<T>) {
  const locale = useLocale();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent contentClassName="bg-background">
        <DrawerHeader className="border-b border-border/80 px-5 py-5 pr-16 text-left">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5">
            <DrawerTitle className="text-2xl tracking-tight">
              {title}
            </DrawerTitle>
            <DrawerDescription className="max-w-2xl text-base leading-7 text-muted-foreground/85">
              {description}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
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
            />
          </div>
        </div>

        <DrawerFooter className="border-t border-border/80 bg-background/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl">
            <Button
              variant="outline"
              size="default"
              className="flex-1 rounded-lg text-sm font-medium"
              onClick={() => onOpenChange(false)}
            >
              {closeLabel}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
