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

type DrawerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

const drawerSizeClasses: Record<DrawerSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
};

interface DetailDrawerRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Width of the drawer on desktop (default: "lg" = max-w-lg) */
  size?: DrawerSize;
  className?: string;
  /** Whether clicking the backdrop closes the drawer (default: true) */
  modal?: boolean;
}

// ─── Root ──────────────────────────────────────────────────────

export function DetailDrawer({
  open,
  onOpenChange,
  children,
  size = "lg",
  className,
  modal = true,
}: DetailDrawerRootProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
      modal={modal}
    >
      <DrawerContent
        showCloseButton={false}
        className={drawerSizeClasses[size]}
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

interface DetailDrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Show a bottom border (default: true) */
  bordered?: boolean;
  /** Optional action elements rendered on the right side of the header (e.g. buttons) */
  actions?: React.ReactNode;
}

DetailDrawer.Header = function DetailDrawerHeaderComponent({
  children,
  className,
  bordered = true,
  actions,
}: DetailDrawerHeaderProps) {
  return (
    <DrawerHeader
      className={cn(
        "shrink-0 p-4",
        bordered && "border-b border-border",
        className,
      )}
    >
      {actions ? (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">{children}</div>
          <div className="shrink-0">{actions}</div>
        </div>
      ) : (
        children
      )}
    </DrawerHeader>
  );
};

// ─── Title ─────────────────────────────────────────────────────

interface DetailDrawerTitleProps {
  children: React.ReactNode;
  className?: string;
}

DetailDrawer.Title = function DetailDrawerTitleComponent({
  children,
  className,
}: DetailDrawerTitleProps) {
  return (
    <DrawerTitle className={cn("text-base", className)}>{children}</DrawerTitle>
  );
};

// ─── Description ───────────────────────────────────────────────

interface DetailDrawerDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

DetailDrawer.Description = function DetailDrawerDescriptionComponent({
  children,
  className,
}: DetailDrawerDescriptionProps) {
  return (
    <DrawerDescription className={cn("text-sm", className)}>
      {children}
    </DrawerDescription>
  );
};

// ─── Body (scrollable) ─────────────────────────────────────────

interface DetailDrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

DetailDrawer.Body = function DetailDrawerBodyComponent({
  children,
  className,
}: DetailDrawerBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-4 py-4", className)}>
      {children}
    </div>
  );
};

// ─── Footer ────────────────────────────────────────────────────

interface DetailDrawerFooterProps {
  children: React.ReactNode;
  className?: string;
  /** Show a top border (default: true) */
  bordered?: boolean;
}

DetailDrawer.Footer = function DetailDrawerFooterComponent({
  children,
  className,
  bordered = true,
}: DetailDrawerFooterProps) {
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

interface DetailDrawerDividerProps {
  className?: string;
}

DetailDrawer.Divider = function DetailDrawerDividerComponent({
  className,
}: DetailDrawerDividerProps) {
  return <div className={cn("border-t border-border my-4", className)} />;
};

// ─── Section (label + content group) ──────────────────────────

interface DetailDrawerSectionProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

DetailDrawer.Section = function DetailDrawerSectionComponent({
  label,
  children,
  className,
}: DetailDrawerSectionProps) {
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
