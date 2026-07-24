"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  error: string | Error | null | undefined;
  className?: string;
  /** Auto-dismiss timeout in ms. Defaults to 0 (no auto-dismiss). */
  autoHide?: number;
}

export function ErrorBanner({
  error,
  className,
  autoHide = 0,
}: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const rawMessage = !error
    ? null
    : typeof error === "string"
      ? error
      : error.message;
  const show = !!rawMessage && !dismissed;

  useEffect(() => {
    // Reset dismissal when error changes
    setDismissed(false);
  }, [rawMessage]);

  useEffect(() => {
    if (!show || !autoHide) return;
    const id = setTimeout(() => setDismissed(true), autoHide);
    return () => clearTimeout(id);
  }, [show, autoHide]);

  if (!show) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "group flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200",
        className,
      )}
    >
      <span className="flex-1">{rawMessage}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-destructive/60 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100"
        aria-label="Заавыг хаах"
      >
        <X className="size-3.5" weight="bold" />
      </button>
    </div>
  );
}
