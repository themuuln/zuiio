"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMNT } from "@/lib/utils";

/** Minimal catalog item shape shared by services and parts. */
export interface CatalogItem {
  id: string;
  name: string;
  name_mn?: string | null;
  default_price: number | null;
}

interface CatalogComboboxProps<T extends CatalogItem> {
  /** Currently filtered catalog items */
  items: T[];
  /** Search value */
  search: string;
  /** Called when search value changes */
  onSearchChange: (val: string) => void;
  /** Called when a catalog item is selected from the dropdown */
  onSelect: (item: T) => void;
  /** Called when "Add as new" is clicked with the search text */
  onAddNew: (name: string) => void;
  /** Whether the given item is already added (disables it in the list) */
  isAdded: (item: T) => boolean;
  /** Placeholder text for the input */
  placeholder: string;
  /** "No match" message */
  noMatchMessage: string;
  /** "Add as new" label */
  addAsNewLabel: string;
  /** Locale for name_mn display */
  locale?: string;
  /** Whether to show the dropdown */
  showDropdown?: boolean;
}

export function CatalogCombobox<T extends CatalogItem>({
  items,
  search,
  onSearchChange,
  onSelect,
  onAddNew,
  isAdded,
  placeholder,
  noMatchMessage,
  addAsNewLabel,
  locale = "en",
  showDropdown = true,
}: CatalogComboboxProps<T>) {
  const q = search.toLowerCase();
  const filtered = search
    ? items.filter((s) => {
        const matchName = s.name.toLowerCase().includes(q);
        const matchNameMn = s.name_mn?.toLowerCase().includes(q) ?? false;
        return matchName || matchNameMn;
      })
    : [];

  return (
    <div className="relative">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
        autoFocus
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-lg bg-background shadow-lg max-h-40 overflow-y-auto">
          {filtered.slice(0, 8).map((item) => {
            const added = isAdded(item);
            return (
              <Button
                variant="ghost"
                key={item.id}
                onClick={() => {
                  if (!added) {
                    onSelect(item);
                    onSearchChange("");
                  }
                }}
                disabled={added}
                className="w-full justify-start px-3 py-2 text-xs h-9"
              >
                <span className="font-medium truncate mr-2 flex-1 text-left">
                  {locale === "mn" && item.name_mn ? item.name_mn : item.name}
                </span>
                <span className="shrink-0 tabular-nums font-medium text-muted-foreground">
                  {formatMNT(Number(item.default_price))}
                </span>
              </Button>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {noMatchMessage}
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => onAddNew(search)}
            className="w-full justify-start px-3 py-2 text-xs h-9 border-t rounded-t-none text-primary font-medium"
          >
            <Plus className="size-3 mr-2" />
            {addAsNewLabel} &ldquo;{search}&rdquo;
          </Button>
        </div>
      )}
    </div>
  );
}
