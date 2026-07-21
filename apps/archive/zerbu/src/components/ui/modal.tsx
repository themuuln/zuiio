"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-md bg-surface dark:bg-dark-surface rounded-[24px] p-6",
          "shadow-warm-lg animate-scale-in",
          className,
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold text-text dark:text-dark-text">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary/20 text-text-secondary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
