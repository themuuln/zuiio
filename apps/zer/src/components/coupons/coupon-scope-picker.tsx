"use client";

import { Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useState } from "react";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CouponScopeItem {
  id: string;
  name: string;
}

/**
 * Searchable multi-select for coupon scope rows (products / categories).
 * Mirrors the ProductPicker interaction (nested drawer + search + list),
 * but keeps a multi-value selection instead of a single pick.
 */
export function CouponScopePicker({
  items,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  noItemsText,
  className,
}: {
  items: CouponScopeItem[];
  value: string[];
  onValueChange: (ids: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  noItemsText: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = new Set(value);
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? items.filter((item) => item.name.toLowerCase().includes(normalized))
    : items;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onValueChange([...next]);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-8 w-full items-center rounded-md border border-input bg-background px-3 text-xs transition-colors hover:bg-muted/40",
          className,
        )}
      >
        {selected.size > 0 ? (
          <span className="truncate font-medium">{selected.size} сонгосон</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>

      <DrawerLayout
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setQuery("");
            setOpen(false);
          }
        }}
        nested
        panelWidth="28rem"
      >
        <div className="flex h-full flex-col gap-4 py-6">
          {/* Search header */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 pl-9 text-base"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Selection list */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {query.trim() ? emptyText : noItemsText}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((item) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 text-left transition-all active:scale-[0.98] hover:border-primary/30 hover:bg-accent",
                        isSelected && "border-primary/40 bg-primary/5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border border-border",
                          isSelected &&
                            "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DrawerLayout>
    </>
  );
}
