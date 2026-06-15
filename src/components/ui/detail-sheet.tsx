"use client";

import type React from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

type SheetSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

const sheetSizeToDrawer: Record<SheetSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
};

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
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent
        showCloseButton={false}
        className={sheetSizeToDrawer[size]}
        contentClassName={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          className,
        )}
      >
        {children}
      </DrawerContent>
    </Drawer>
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
    <DrawerHeader
      className={cn(
        "shrink-0 p-4",
        bordered && "border-b border-border",
        className,
      )}
    >
      {children}
    </DrawerHeader>
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
    <DrawerTitle className={cn("text-base", className)}>{children}</DrawerTitle>
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
    <DrawerDescription className={cn("text-sm", className)}>
      {children}
    </DrawerDescription>
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
    <DrawerFooter
      className={cn(
        "shrink-0 p-4",
        bordered && "border-t border-border",
        className,
      )}
    >
      {children}
    </DrawerFooter>
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

