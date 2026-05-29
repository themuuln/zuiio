"use client";

import { Loader2, Search, X } from "lucide-react";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<ComponentProps<"input">, "onChange"> {
  onSearch?: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  value?: string;
  /** Shortcut key to focus this input, e.g. "k" for Cmd+K. Set to false to disable. */
  focusShortcut?: string | false;
}

export function SearchInput({
  onSearch = () => {},
  loading = false,
  placeholder = "Search...",
  debounceMs,
  className,
  value: externalValue,
  focusShortcut = "k",
  ...inputProps
}: SearchInputProps) {
  const { onFocus, ...restInputProps } = inputProps;
  const [value, setValue] = useState(externalValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const shortcutLabel = focusShortcut
    ? `Cmd+${focusShortcut.toUpperCase()}`
    : undefined;
  useEffect(() => {
    if (externalValue !== undefined) {
      setValue(externalValue);
    }
  }, [externalValue]);

  // Keyboard shortcut to focus
  useEffect(() => {
    if (!focusShortcut) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === focusShortcut &&
        !isEditingActive()
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusShortcut]);

  const handleInputChange = useCallback(
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
    inputRef.current?.focus();
  }, [onSearch]);

  return (
    <InputGroup className={cn("h-11 rounded-xl bg-background", className)}>
      <InputGroupAddon align="inline-start">
        <Search className="size-5" aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="text"
        data-slot="search-input"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 text-base"
        {...restInputProps}
      />
      {shortcutLabel && !value && !loading && (
        <InputGroupAddon align="inline-end">
          <kbd className="hidden items-center gap-0.5 sm:flex">
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1 text-[10px] font-medium text-muted-foreground/60">
              {shortcutLabel}
            </span>
          </kbd>
        </InputGroupAddon>
      )}
      {loading && (
        <InputGroupAddon align="inline-end">
          <Loader2 className="size-5 animate-spin" aria-label="Searching..." />
        </InputGroupAddon>
      )}
      {!loading && value && (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            data-slot="touch-target"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

/**
 * Returns true if the user is currently editing a text-like element,
 * so keyboard shortcuts don't hijack normal typing.
 */
function isEditingActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return [
      "text",
      "search",
      "email",
      "number",
      "password",
      "tel",
      "url",
    ].includes(type);
  }
  return (
    el.getAttribute("role") === "textbox" ||
    (el as HTMLElement).isContentEditable
  );
}
