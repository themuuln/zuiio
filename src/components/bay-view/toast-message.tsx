"use client";

import { AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ToastMessageProps {
  message: string;
  variant: "info" | "error";
  onDismiss?: () => void;
  duration?: number;
}

export function ToastMessage({
  message,
  variant,
  onDismiss,
  duration = 4000,
}: ToastMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-200",
        variant === "info" && "border-primary/30 bg-primary/10 text-primary",
        variant === "error" && "border-red-500/30 bg-red-500/10 text-red-500",
      )}
    >
      {variant === "info" ? (
        <Info className="size-4 shrink-0" />
      ) : (
        <AlertCircle className="size-4 shrink-0" />
      )}
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 rounded-md hover:bg-muted/50 px-1 py-0.5 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}
