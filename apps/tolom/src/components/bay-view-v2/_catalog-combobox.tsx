"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Check, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cn, formatMNT } from "@/lib/utils";
import type { PriceMatchQuality } from "./_drawer-types";

/** Minimal catalog item shape shared by services and parts. */
export interface CatalogItem {
  id: string;
  name: string;
  name_mn?: string | null;
  default_price: number | null;
  last_price?: number | null;
  last_make?: string | null;
  last_model?: string | null;
  match_quality?: PriceMatchQuality | null;
  category?: string | null;
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
  /** Whether to render results as a popover or an inline list */
  resultsMode?: "popover" | "inline";
}

/** Tailwind text color class per match quality tier. */
const MATCH_COLORS: Record<PriceMatchQuality, string> = {
  exact: "text-green-600 dark:text-green-400",
  same_make: "text-muted-foreground/60",
  fallback: "text-muted-foreground/30",
};

/** Match quality indicator dot colors. */
const MATCH_DOT_COLORS: Record<PriceMatchQuality, string> = {
  exact: "bg-green-500",
  same_make: "bg-yellow-400",
  fallback: "bg-muted-foreground/30",
};

/** Human-readable label for tooltip per match quality tier. */
const MATCH_LABELS: Record<PriceMatchQuality, string> = {
  exact: "Exact vehicle match",
  same_make: "Same make, different model",
  fallback: "Different make — closest available price",
};

/**
 * Renders the last price (from price memory) with match quality dot.
 */
function LastPriceDot({
  matchQuality,
}: {
  matchQuality?: PriceMatchQuality | null;
}) {
  if (!matchQuality) return null;
  return (
    <span
      title={MATCH_LABELS[matchQuality]}
      className={cn(
        "inline-block size-1.5 rounded-full shrink-0",
        MATCH_DOT_COLORS[matchQuality],
      )}
    />
  );
}

/**
 * Renders formatted price or "—" when price is null/undefined.
 * When both last_price and default_price exist and differ, shows both.
 */
function PriceDisplay({
  price,
  defaultPrice,
  matchQuality,
}: {
  price: number | null | undefined;
  defaultPrice?: number | null | undefined;
  matchQuality?: PriceMatchQuality | null;
}) {
  const showDefault =
    defaultPrice != null &&
    defaultPrice > 0 &&
    price != null &&
    price > 0 &&
    defaultPrice !== price;

  if ((price == null || price <= 0) && !showDefault) {
    return (
      <span className="shrink-0 tabular-nums font-medium text-muted-foreground/40">
        —&#x2009;₮
      </span>
    );
  }

  const colorClass = matchQuality
    ? MATCH_COLORS[matchQuality]
    : "text-green-600 dark:text-green-400";
  const tooltip = matchQuality ? MATCH_LABELS[matchQuality] : undefined;

  return (
    <span className="flex items-center gap-1 shrink-0">
      <span
        title={tooltip}
        className={cn("tabular-nums font-medium transition-colors", colorClass)}
      >
        {price != null && price > 0 ? formatMNT(price) : "—"}
      </span>
      {showDefault && (
        <span className="tabular-nums text-[10px] text-muted-foreground/40 line-through">
          {formatMNT(defaultPrice)}
        </span>
      )}
      <LastPriceDot matchQuality={matchQuality} />
    </span>
  );
}

function NameDisplay({ item, locale }: { item: CatalogItem; locale: string }) {
  return locale === "mn" && item.name_mn ? item.name_mn : item.name;
}

/**
 * Extracts a display category label from the item.
 */
function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Бусад";
  return category;
}

function groupByCategory<T extends CatalogItem>(
  items: T[],
): { category: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const cat = getCategoryLabel(item.category);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)?.push(item);
  }
  return Array.from(map.entries())
    .map(([category, catItems]) => ({ category, items: catItems }))
    .sort((a, b) => {
      if (a.category === "Бусад") return 1;
      if (b.category === "Бусад") return -1;
      return a.category.localeCompare(b.category);
    });
}

// ── Inline results via cmdk ────────────────────────────────

function InlineCatalogResults<T extends CatalogItem>({
  items,
  search,
  onSearchChange,
  onSelect,
  onAddNew,
  isAdded,
  noMatchMessage,
  addAsNewLabel,
  locale,
  placeholder,
}: {
  items: T[];
  search: string;
  onSearchChange: (val: string) => void;
  onSelect: (item: T) => void;
  onAddNew: (name: string) => void;
  isAdded: (item: T) => boolean;
  noMatchMessage: string;
  addAsNewLabel: string;
  locale: string;
  placeholder: string;
}) {
  const hasItems = items.length > 0;

  // Genuinely empty catalog — nothing at all
  if (!hasItems && !search) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-muted-foreground/50">
        <div className="flex flex-col items-center gap-2 text-center">
          <Search className="size-8 text-muted-foreground/20" />
          <span className="max-w-xs">{placeholder}</span>
        </div>
      </div>
    );
  }

  const grouped = groupByCategory(items);

  return (
    <Command shouldFilter className="flex size-full flex-col overflow-hidden">
      {/* Search input */}
      <div className="relative px-3 pt-3 pb-1.5">
        <Search className="pointer-events-none absolute left-6 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/30" />
        <CommandPrimitive.Input
          value={search}
          onValueChange={onSearchChange}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-border/80 bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* Results list */}
      <CommandList className="no-scrollbar max-h-none flex-1 overflow-y-auto px-1.5 pb-1.5">
        <CommandEmpty>
          <div className="flex flex-col items-center px-6 py-6">
            <p className="mb-3 text-sm text-muted-foreground/70">
              {noMatchMessage}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddNew(search)}
              className="gap-1.5 rounded-full"
            >
              <Plus className="size-3.5" />
              {addAsNewLabel} &ldquo;{search}&rdquo;
            </Button>
          </div>
        </CommandEmpty>

        {grouped.map(({ category, items: catItems }) => (
          <CommandGroup key={category} heading={category}>
            {catItems.map((item) => {
              const added = isAdded(item);
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.name} ${item.name_mn ?? ""}`}
                  onSelect={() => {
                    if (!added) {
                      onSelect(item);
                      onSearchChange("");
                    }
                  }}
                  disabled={added}
                  className="flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 aria-selected:bg-accent/60 data-disabled:opacity-50"
                >
                  {/* Selection checkmark */}
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      added
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground/25",
                    )}
                  >
                    {added && <Check className="size-2.5" />}
                  </div>

                  {/* Name */}
                  <span className="flex-1 whitespace-normal text-left text-sm font-medium leading-snug">
                    {locale === "mn" && item.name_mn ? item.name_mn : item.name}
                  </span>

                  {/* Price */}
                  <PriceDisplay
                    price={item.last_price ?? item.default_price}
                    defaultPrice={item.default_price}
                    matchQuality={item.match_quality}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

// ── Popover results (existing pattern) ─────────────────────

function PopoverCatalogResults<T extends CatalogItem>({
  items,
  search,
  onSelect,
  onAddNew,
  isAdded,
  noMatchMessage,
  addAsNewLabel,
  locale,
  hasSearch,
}: {
  items: T[];
  search: string;
  onSelect: (item: T) => void;
  onAddNew: (name: string) => void;
  isAdded: (item: T) => boolean;
  noMatchMessage: string;
  addAsNewLabel: string;
  locale: string;
  hasSearch: boolean;
}) {
  return (
    <>
      {items.map((item) => {
        const added = isAdded(item);
        return (
          <Button
            variant="ghost"
            key={item.id}
            onClick={() => {
              if (!added) {
                onSelect(item);
              }
            }}
            disabled={added}
            className={cn(
              "w-full justify-start px-3 text-left h-9 py-2 text-xs",
              added ? "cursor-default opacity-50" : "hover:bg-accent",
            )}
          >
            <span className="mr-3 flex-1 truncate text-left font-medium">
              <NameDisplay item={item} locale={locale} />
            </span>
            <PriceDisplay
              price={item.last_price ?? item.default_price}
              matchQuality={item.match_quality}
            />
          </Button>
        );
      })}

      {hasSearch && items.length === 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {noMatchMessage}
        </div>
      )}

      {hasSearch && (
        <Button
          variant="ghost"
          onClick={() => onAddNew(search)}
          className="w-full justify-start rounded-t-none border-t px-3 py-2 text-xs font-medium text-primary"
        >
          <Plus className="mr-2 size-3" />
          {addAsNewLabel} &ldquo;{search}&rdquo;
        </Button>
      )}
    </>
  );
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
  resultsMode = "popover",
}: CatalogComboboxProps<T>) {
  const q = search.toLowerCase();
  const hasSearch = search.trim().length > 0;
  const filtered = hasSearch
    ? items.filter((s) => {
        const matchName = s.name.toLowerCase().includes(q);
        const matchNameMn = s.name_mn?.toLowerCase().includes(q) ?? false;
        return matchName || matchNameMn;
      })
    : items;
  const isInline = resultsMode === "inline";

  // Inline mode — full-page searchable list with cmdk
  if (isInline) {
    return (
      <InlineCatalogResults
        items={items}
        search={search}
        onSearchChange={onSearchChange}
        onSelect={(item) => {
          onSelect(item);
        }}
        onAddNew={onAddNew}
        isAdded={isAdded}
        noMatchMessage={noMatchMessage}
        addAsNewLabel={addAsNewLabel}
        locale={locale}
        placeholder={placeholder}
      />
    );
  }

  // Popover mode — compact dropdown
  const results = filtered.slice(0, 8);

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
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border bg-background shadow-lg">
          <PopoverCatalogResults
            items={results}
            search={search}
            onSelect={(item) => {
              onSelect(item);
              onSearchChange("");
            }}
            onAddNew={onAddNew}
            isAdded={isAdded}
            noMatchMessage={noMatchMessage}
            addAsNewLabel={addAsNewLabel}
            locale={locale}
            hasSearch={hasSearch}
          />
        </div>
      )}
    </div>
  );
}
