"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface InvoiceQrPopoverProps {
  url: string;
  children: React.ReactNode;
}

export function InvoiceQrPopover({ url, children }: InvoiceQrPopoverProps) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate QR code when URL changes
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 160,
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

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      {open && qrDataUrl && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
            "rounded-lg border border-border bg-popover shadow-xl p-3",
            "flex flex-col items-center gap-2",
            "animate-in fade-in zoom-in-95 duration-150",
          )}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <img
            src={qrDataUrl}
            alt="Invoice QR code"
            width={160}
            height={160}
            className="rounded-md"
          />
          <span className="text-xs text-muted-foreground text-center leading-tight">
            Scan to view invoice
          </span>
          {/* Arrow pointing down to the button */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-border" />
        </div>
      )}
    </div>
  );
}
