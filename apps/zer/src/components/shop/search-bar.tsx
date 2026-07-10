"use client";

import { MagnifyingGlass, XCircle } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Бүтээгдэхүүн хайх...",
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        className={cn(
          "h-[44px] w-full rounded-lg border pl-9 pr-9 text-sm",
          "focus-visible:ring-2 focus-visible:ring-primary/20",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Цэвэрлэх"
        >
          <XCircle className="size-4" />
        </button>
      )}
    </div>
  );
}
