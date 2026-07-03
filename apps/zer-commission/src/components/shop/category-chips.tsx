"use client";

import { cn } from "@/lib/utils";

export type CategoryChip = {
  id: string;
  name: string;
};

type CategoryChipsProps = {
  categories: CategoryChip[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function CategoryChips({
  categories,
  selectedId,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div
      className="w-full overflow-x-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="flex gap-2 px-1 pb-1" style={{ minWidth: "max-content" }}>
        {/* "All" chip — always present */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "flex h-[44px] shrink-0 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors whitespace-nowrap",
            selectedId === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          Бүгд
        </button>

        {categories.map((category) => {
          const isSelected = selectedId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : category.id)}
              className={cn(
                "flex h-[44px] shrink-0 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors whitespace-nowrap",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
