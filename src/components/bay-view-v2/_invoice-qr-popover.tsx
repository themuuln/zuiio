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
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={handleClick}
    >
      {children}
      {open && qrDataUrl && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50",
            "rounded-xl border border-border bg-popover shadow-2xl p-5",
            "flex flex-col items-center gap-3",
            "animate-in fade-in zoom-in-95 duration-150",
          )}
          style={{ width: 280 }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
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
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-border" />
        </div>
      )}
    </div>
  );
}
