"use client";

import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InvoiceQrPopoverProps {
  url: string;
  children: React.ReactNode;
}

export function InvoiceQrPopover({ url, children }: InvoiceQrPopoverProps) {
  const t = useTranslations("bayView");
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate QR code when URL changes
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [url]);

  function handleEnter() {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }

  function handleClick() {
    window.open(url, "_blank");
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: positioned container for hover popover, not a native button
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
      {open && qrDataUrl && (
        // biome-ignore lint/a11y/useSemanticElements: positioned popover container, not a native button
        <div
          role="button"
          tabIndex={0}
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50",
            "rounded-xl border border-border bg-popover p-5 ring-1 ring-foreground/10",
            "flex flex-col items-center gap-3",
            "animate-in fade-in zoom-in-95 duration-150",
          )}
          style={{ width: 280 }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: QR code is a dynamic data URL, not optimizable by next/image */}
          <img
            src={qrDataUrl}
            alt={t("invoiceQrCode")}
            width={240}
            height={240}
            className="rounded-lg"
          />
          <span className="text-sm font-medium text-muted-foreground text-center leading-snug">
            {t("scanToViewInvoice")}
          </span>
          {/* Arrow pointing down to the button */}
          <svg
            className="absolute top-full left-1/2 -translate-x-1/2"
            width="14"
            height="7"
            viewBox="0 0 14 7"
            fill="none"
            aria-hidden="true"
          >
            <path d="M0 0H14L7 7L0 0Z" className="fill-border" />
          </svg>
        </div>
      )}
    </div>
  );
}
