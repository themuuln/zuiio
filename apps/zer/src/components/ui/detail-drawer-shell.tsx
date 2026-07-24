"use client";

import type * as React from "react";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface DetailDrawerShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Optional edit callback. When provided, renders an Edit button in the body header area. */
  onEdit?: () => void;
  /** Optional delete callback. When provided, renders a Delete button in the body header area. */
  onDelete?: () => void;
  /** Optional status mapping for a status badge shown below the title */
  status?: {
    value: string;
    mapping: Record<
      string,
      {
        label: string;
        variant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline"
          | "ghost"
          | "link";
      }
    >;
  };
  /** Whether the delete action is pending */
  isDeletePending?: boolean;
  /** Width of the drawer panel. Defaults to 28rem. */
  panelWidth?: string;
  /** Fixed footer slot at the bottom of the drawer. */
  footer?: React.ReactNode;
  /**
   * Determines if the drawer enters a modal state when open.
   * @default true
   */
  modal?: boolean | "trap-focus";
}

/**
 * Standardized detail drawer layout with consistent header actions (Edit/Delete),
 * optional status badge, scrollable content area, and optional footer.
 *
 * Renders description + status in the DrawerLayout's full-width header strip.
 * Renders action buttons (Edit/Delete) as the first element in the scrollable body.
 */
export function DetailDrawerShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  onEdit,
  onDelete,
  status,
  isDeletePending = false,
  panelWidth = "28rem",
  footer,
  modal = true,
}: DetailDrawerShellProps) {
  const hasActions = onEdit || onDelete;

  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      panelWidth={panelWidth}
      modal={modal}
      title={title}
      description={status ? `${description ?? ""}` : description}
      footer={footer}
    >
      {/* Status badge and action buttons at the top of the body */}
      {(status || hasActions) && (
        <div className="flex items-center justify-between gap-2 mb-6">
          {status && (
            <StatusBadge value={status.value} mapping={status.mapping} />
          )}
          {hasActions && (
            <div
              className="flex shrink-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium",
                    "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
                    "transition-colors",
                  )}
                >
                  Засах
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeletePending}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium",
                    "border border-border bg-transparent hover:bg-destructive hover:text-destructive-foreground",
                    "transition-colors",
                    isDeletePending && "opacity-50 pointer-events-none",
                  )}
                >
                  Устгах
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </DrawerLayout>
  );
}
