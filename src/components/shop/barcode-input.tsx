"use client";

import { Barcode, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import type { ProductCardProduct } from "@/components/shop/product-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BarcodeInputProps = {
  products: ProductCardProduct[];
};

type BarcodeStatus =
  | { type: "idle" }
  | { type: "found"; product: ProductCardProduct }
  | { type: "not-found"; barcode: string }
  | { type: "error"; message: string };

export function BarcodeInput({ products }: BarcodeInputProps) {
  const { addItem } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<BarcodeStatus>({ type: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    // Focus after a short delay to avoid stealing focus from other elements
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, []);

  // Clear status after a delay
  const clearStatusAfterDelay = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setStatus({ type: "idle" });
    }, 2000);
  };

  const handleBarcodeSearch = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      setStatus({ type: "idle" });
      return;
    }

    // Search for product by barcode (case-insensitive)
    const product = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase(),
    );

    if (product) {
      const stock = Number(product.current_stock ?? 0);
      if (stock <= 0) {
        setStatus({
          type: "error",
          message: `"${product.name}" дууссан байна.`,
        });
        clearStatusAfterDelay();
        return;
      }

      // Add to cart
      addItem({
        productId: product.id,
        name: product.name,
        unitPrice: Number(product.sale_price ?? 0),
        unit: product.unit ?? "ш",
        maxStock: stock,
      });

      setStatus({ type: "found", product });
      clearStatusAfterDelay();
    } else {
      setStatus({ type: "not-found", barcode: trimmed });
      clearStatusAfterDelay();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear previous status when user types
    if (status.type !== "idle") {
      setStatus({ type: "idle" });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarcodeSearch(value);
      setValue("");
    }
  };

  // Handle paste for scanner input (some scanners simulate paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      // Brief delay to let the paste complete
      setTimeout(() => {
        handleBarcodeSearch(pastedText);
        setValue("");
      }, 0);
    }
  };

  // Handle blur to refocus (for scanner workflow)
  const handleBlur = () => {
    // Re-focus after a short delay unless the user is interacting elsewhere
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Barcode className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder="Баркод оруулах эсвэл скан хийх..."
          autoComplete="off"
          autoFocus
          className={cn(
            "h-[44px] w-full rounded-lg border pl-9 pr-9 text-sm font-mono tracking-wider",
            "focus-visible:ring-2 focus-visible:ring-primary/20",
            status.type === "found" &&
              "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30",
            status.type === "not-found" &&
              "border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/30",
            status.type === "error" && "border-destructive bg-destructive/10",
          )}
        />
      </div>

      {/* Status indicator */}
      {status.type !== "idle" && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {status.type === "found" && (
            <>
              <CheckCircle
                className="size-4 text-emerald-600 dark:text-emerald-400"
                weight="fill"
              />
              <span className="text-emerald-700 dark:text-emerald-300">
                <strong>{status.product.name}</strong> сагсанд нэмэгдлээ.
              </span>
            </>
          )}
          {status.type === "not-found" && (
            <>
              <XCircle
                className="size-4 text-amber-600 dark:text-amber-400"
                weight="fill"
              />
              <span className="text-amber-700 dark:text-amber-300">
                &ldquo;{status.barcode}&rdquo; баркодтой бүтээгдэхүүн олдсонгүй.
              </span>
            </>
          )}
          {status.type === "error" && (
            <>
              <XCircle className="size-4 text-destructive" weight="fill" />
              <span className="text-destructive">{status.message}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
