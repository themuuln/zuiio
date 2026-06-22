"use client";

import { CaretLeft, X } from "@phosphor-icons/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

interface NestedDrawerPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Title of the parent section shown as a breadcrumb back button. */
  parentTitle?: string;
  className?: string;
  /**
   * Width of the nested panel. Defaults to "100%" (full width of the parent content area).
   * Set to a narrower value like "80%" to show a peek of the parent content behind.
   */
  width?: string;
  /** Optional footer rendered at the bottom of the panel. */
  footer?: React.ReactNode;
}

/**
 * Nested drawer panel that renders inline within the parent drawer's content area
 * (no Portal, no Base UI Drawer). Slides in from the right with a transform animation,
 * giving a true nested feel where the parent drawer remains visible behind.
 *
 * The parent drawer's header and footer stay visible, while this panel covers
 * the content area.
 */
export function NestedDrawerPanel({
  open,
  onClose,
  title,
  description,
  children,
  parentTitle,
  className,
  width = "100%",
  footer,
}: NestedDrawerPanelProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col bg-background transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
        open ? "translate-x-0" : "translate-x-full pointer-events-none",
        className,
      )}
      style={{ width }}
    >
      {/* Panel header */}
      <div className="shrink-0 bg-card border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {parentTitle && (
              <button
                type="button"
                onClick={onClose}
                className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CaretLeft className="size-3" />
                {parentTitle}
              </button>
            )}
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6">{children}</div>

      {/* Panel footer */}
      {footer && (
        <div className="shrink-0 bg-card border-t border-border px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}
