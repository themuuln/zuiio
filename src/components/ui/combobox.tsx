"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// --- Context ---

type ComboboxContextValue<T> = {
  items: T[];
  inputValue: string;
  open: boolean;
  highlightedIndex: number;
  itemToStringLabel: (item: T | null) => string;
  onValueChange: (value: T | null) => void;
  onInputValueChange: (value: string) => void;
  setOpen: (open: boolean) => void;
  setHighlightedIndex: (index: number) => void;
  onCreate?: (label: string) => void;
};

const ComboboxContext = React.createContext<ComboboxContextValue<any> | null>(
  null,
);

function useComboboxContext<T>() {
  const ctx = React.useContext(ComboboxContext);
  if (!ctx) {
    throw new Error("Combobox sub-components must be used within Combobox");
  }
  return ctx as ComboboxContextValue<T>;
}

// --- Combobox ---

interface ComboboxProps<T> {
  name?: string;
  items: T[];
  value?: T | null;
  defaultValue?: string;
  required?: boolean;
  onValueChange: (value: T | null) => void;
  itemToStringLabel: (item: T | null) => string;
  itemToStringValue?: (item: T | null) => string;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onItemHighlighted?: (item: T | null) => void;
  onCreate?: (label: string) => void;
  children: React.ReactNode;
}

function ComboboxInner<T>(
  {
    name,
    items,
    value,
    required,
    onValueChange,
    itemToStringLabel,
    itemToStringValue,
    inputValue,
    onInputValueChange,
    onItemHighlighted,
    onCreate,
    children,
  }: ComboboxProps<T>,
  _ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          onItemHighlighted?.(items[next] ?? null);
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          onItemHighlighted?.(items[next] ?? null);
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < items.length) {
          const selected = items[highlightedIndex];
          if (selected !== undefined) {
            onValueChange(selected);
            setOpen(false);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <ComboboxContext.Provider
      value={{
        items,
        inputValue,
        open,
        highlightedIndex,
        itemToStringLabel,
        onValueChange,
        onInputValueChange,
        setOpen,
        setHighlightedIndex,
        onCreate,
      }}
    >
      <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
        <input
          type="hidden"
          name={name}
          value={
            value && itemToStringValue
              ? itemToStringValue(value)
              : value !== null && value !== undefined
                ? String(value)
                : ""
          }
          required={required}
        />
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

const Combobox = React.forwardRef(ComboboxInner) as <T>(
  props: ComboboxProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;
(
  Combobox as React.ForwardRefExoticComponent<
    ComboboxProps<any> & React.RefAttributes<HTMLDivElement>
  >
).displayName = "Combobox";

// --- ComboboxInput ---

interface ComboboxInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  showTrigger?: boolean;
}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  ({ className, showTrigger, id, placeholder, ...props }, ref) => {
    const ctx = useComboboxContext();

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="text"
          placeholder={placeholder}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            showTrigger && "pr-8",
            className,
          )}
          value={ctx.inputValue}
          onChange={(e) => {
            ctx.onInputValueChange(e.target.value);
            ctx.setOpen(true);
          }}
          onFocus={() => ctx.setOpen(true)}
          {...props}
        />
        {showTrigger && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => {
              e.preventDefault();
              ctx.setOpen(!ctx.open);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);
ComboboxInput.displayName = "ComboboxInput";

// --- ComboboxContent ---

const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = useComboboxContext();
  if (!ctx.open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 w-full rounded-md border border-input bg-popover text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    />
  );
});
ComboboxContent.displayName = "ComboboxContent";

// --- ComboboxList ---

const ComboboxList = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: React.ReactNode | ((item: any) => React.ReactNode);
  }
>(({ className, children, ...props }, ref) => {
  const ctx = useComboboxContext();

  if (!ctx.open) return null;

  return (
    <ul
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto py-1", className)}
      {...props}
    >
      {typeof children === "function"
        ? ctx.items.map((item, index) => (
            <li
              key={index}
              aria-selected={index === ctx.highlightedIndex}
              className={cn(
                "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                index === ctx.highlightedIndex &&
                  "bg-accent text-accent-foreground",
              )}
              onMouseEnter={() => ctx.setHighlightedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                ctx.onValueChange(item);
                ctx.setOpen(false);
              }}
            >
              {(children as (item: any) => React.ReactNode)(item)}
            </li>
          ))
        : children}
    </ul>
  );
});
ComboboxList.displayName = "ComboboxList";

// --- ComboboxEmpty ---

const ComboboxEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = useComboboxContext();
  // Hide when there are items, or when we can create a new item from input
  if (ctx.items.length > 0) return null;
  if (ctx.inputValue.trim() && ctx.onCreate) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "py-6 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
});
ComboboxEmpty.displayName = "ComboboxEmpty";

// --- ComboboxCreate ---

const ComboboxCreate = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = useComboboxContext();
  if (!ctx.open || !ctx.inputValue.trim() || ctx.items.length > 0) return null;
  if (!ctx.onCreate) return null;
  return (
    <div
      ref={ref}
      role="option"
      aria-selected={false}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        ctx.onCreate(ctx.inputValue.trim());
        ctx.setOpen(false);
      }}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 shrink-0"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>
        &ldquo;
        {ctx.inputValue.trim()}
        &rdquo; нэмэх
      </span>
    </div>
  );
});
ComboboxCreate.displayName = "ComboboxCreate";

// --- ComboboxItem ---

interface ComboboxItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: unknown;
}

const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 hover:bg-accent hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
ComboboxItem.displayName = "ComboboxItem";

export {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxContent,
  ComboboxItem,
  ComboboxCreate,
};
