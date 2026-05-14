"use client";

import { Loader2, Search, X } from "lucide-react";
import { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<ComponentProps<"input">, "onChange"> {
  onSearch?: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  value?: string;
}

export function SearchInput({
  onSearch = () => {},
  loading = false,
  placeholder = "Search...",
  debounceMs,
  className,
  value: externalValue,
  ...inputProps
}: SearchInputProps) {
  const [value, setValue] = useState(externalValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (externalValue !== undefined) {
      setValue(externalValue);
    }
  }, [externalValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (debounceMs && debounceMs > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onSearch(newValue);
        }, debounceMs);
      }
    },
    [debounceMs, onSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (timerRef.current) clearTimeout(timerRef.current);
        onSearch(value);
      }
    },
    [onSearch, value],
  );

  const handleClear = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex h-12 w-full rounded-xl border border-input bg-background",
          "pl-11 pr-10 text-base placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...inputProps}
      />
      {loading && (
        <Loader2
          className="absolute right-4 top-1/2 -translate-y-1/2 size-5 animate-spin text-muted-foreground"
          aria-label="Searching..."
        />
      )}
      {!loading && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
          aria-label="Clear search"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
