"use client";

import type React from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

type SheetSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

interface DetailSheetRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Width of the sheet on desktop (default: "lg" = max-w-lg) */
  size?: SheetSize;
  className?: string;
}

// ─── Root ──────────────────────────────────────────────────────

export function DetailSheet({
  open,
  onOpenChange,
  children,
  size = "lg",
  className,
}: DetailSheetRootProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size={size}
        className={cn("flex flex-col p-0 gap-0 overflow-hidden", className)}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}

// ─── Header ────────────────────────────────────────────────────

interface DetailSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Show a bottom border (default: true) */
  bordered?: boolean;
}

DetailSheet.Header = function DetailSheetHeaderComponent({
  children,
  className,
  bordered = true,
}: DetailSheetHeaderProps) {
  return (
    <SheetHeader
      className={cn(
        "shrink-0 p-4",
        bordered && "border-b border-border",
        className,
      )}
    >
      {children}
    </SheetHeader>
  );
};

// ─── Title ─────────────────────────────────────────────────────

interface DetailSheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

DetailSheet.Title = function DetailSheetTitleComponent({
  children,
  className,
}: DetailSheetTitleProps) {
  return (
    <SheetTitle className={cn("text-base", className)}>{children}</SheetTitle>
  );
};

// ─── Description ───────────────────────────────────────────────

interface DetailSheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

DetailSheet.Description = function DetailSheetDescriptionComponent({
  children,
  className,
}: DetailSheetDescriptionProps) {
  return (
    <SheetDescription className={cn("text-sm", className)}>
      {children}
    </SheetDescription>
  );
};

// ─── Body (scrollable) ─────────────────────────────────────────

interface DetailSheetBodyProps {
  children: React.ReactNode;
  className?: string;
}

DetailSheet.Body = function DetailSheetBodyComponent({
  children,
  className,
}: DetailSheetBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-4 py-4", className)}>
      {children}
    </div>
  );
};

// ─── Footer ────────────────────────────────────────────────────

interface DetailSheetFooterProps {
  children: React.ReactNode;
  className?: string;
  /** Show a top border (default: true) */
  bordered?: boolean;
}

DetailSheet.Footer = function DetailSheetFooterComponent({
  children,
  className,
  bordered = true,
}: DetailSheetFooterProps) {
  return (
    <SheetFooter
      className={cn(
        "shrink-0 p-4",
        bordered && "border-t border-border",
        className,
      )}
    >
      {children}
    </SheetFooter>
  );
};

// ─── Divider (for visual separation inside body) ──────────────

interface DetailSheetDividerProps {
  className?: string;
}

DetailSheet.Divider = function DetailSheetDividerComponent({
  className,
}: DetailSheetDividerProps) {
  return <div className={cn("border-t border-border my-4", className)} />;
};

// ─── Section (label + content group) ──────────────────────────

interface DetailSheetSectionProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

DetailSheet.Section = function DetailSheetSectionComponent({
  label,
  children,
  className,
}: DetailSheetSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h4>
      )}
      {children}
    </div>
  );
};
