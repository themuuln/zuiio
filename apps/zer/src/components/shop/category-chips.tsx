"use client";

import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type CategoryChip = {
  id: string;
  name: string;
};

type CategoryChipsProps = {
  categories: CategoryChip[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
};

export const CategoryChips = memo(function CategoryChips({
  categories,
  selectedId,
  onSelect,
  className,
}: CategoryChipsProps) {
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const selectedButton = selectedButtonRef.current;
    const expectedCategoryId = selectedId ?? "";
    if (
      !selectedButton ||
      selectedButton.dataset.categoryId !== expectedCategoryId
    ) {
      return;
    }

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    selectedButton.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedId]);

  const chipClassName =
    "flex h-[44px] shrink-0 snap-start items-center justify-center whitespace-nowrap rounded-full border px-5 text-sm font-medium transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <nav
      aria-label="Бүтээгдэхүүний ангилал"
      className={cn(
        "sticky top-[112px] z-10 w-full snap-x snap-proximity touch-pan-x overflow-x-auto overscroll-x-contain bg-background pt-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <div className="flex w-max gap-2 px-1 pb-1">
        <button
          ref={selectedId === null ? selectedButtonRef : undefined}
          data-category-id=""
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedId === null}
          className={cn(
            chipClassName,
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
              ref={isSelected ? selectedButtonRef : undefined}
              data-category-id={category.id}
              key={category.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : category.id)}
              aria-pressed={isSelected}
              className={cn(
                chipClassName,
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
    </nav>
  );
});
