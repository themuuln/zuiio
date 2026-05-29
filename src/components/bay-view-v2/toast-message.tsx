"use client";

import { AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
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
        "fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300 sm:bottom-10",
        variant === "info" &&
          "border-primary/25 bg-background/90 text-primary shadow-primary/15 ring-1 ring-primary/10",
        variant === "error" &&
          "border-red-500/25 bg-background/90 text-red-500 shadow-red-500/15 ring-1 ring-red-500/10",
      )}
    >
      {variant === "info" ? (
        <Info className="size-4 shrink-0" />
      ) : (
        <AlertCircle className="size-4 shrink-0" />
      )}
      <span>{message}</span>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-2 h-auto px-1 py-0.5 text-xs"
        >
          ✕
        </Button>
      )}
    </div>
  );
}
