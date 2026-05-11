"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type DropdownContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx)
    throw new Error("Dropdown components must be used within <DropdownMenu>");
  return ctx;
}

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<"button">) {
  const { open, setOpen } = useDropdown();
  return (
    <button
      type="button"
      data-slot="dropdown-menu-trigger"
      className={cn("cursor-pointer", className)}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  className,
  align = "end",
  children,
  ...props
}: ComponentProps<"div"> & { align?: "start" | "end" }) {
  const { open } = useDropdown();

  if (!open) return null;

  return (
    <div
      data-slot="dropdown-menu-content"
      role="menu"
      className={cn(
        "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ className, ...props }: ComponentProps<"button">) {
  const { setOpen } = useDropdown();

  return (
    <button
      type="button"
      role="menuitem"
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<"hr">) {
  return (
    <hr
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 border-border", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
