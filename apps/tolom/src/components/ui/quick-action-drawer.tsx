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

type QuickActionDrawerSize = "sm" | "md";

const sizeClasses: Record<QuickActionDrawerSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
};

interface QuickActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  modal?: boolean;
  /** Width of the drawer on desktop (default: "sm" = max-w-sm) */
  size?: QuickActionDrawerSize;
}

/**
 * A compact drawer for quick action flows (choose from options, confirm,
 * pick from a list, etc.). Not for detail/edit views — use DetailDrawer for those.
 *
 * Fixed at `sm:max-w-sm` width for quick, focused interactions.
 */
export function QuickActionDrawer({
  open,
  onOpenChange,
  children,
  className,
  modal = true,
  size = "sm",
}: QuickActionDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
      modal={modal}
    >
      <DrawerContent
        showCloseButton={false}
        className={sizeClasses[size]}
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

interface QuickActionHeaderProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

QuickActionDrawer.Header = function QuickActionHeaderComponent({
  children,
  className,
  bordered = true,
}: QuickActionHeaderProps) {
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

QuickActionDrawer.Title = function QuickActionTitleComponent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DrawerTitle className={cn("text-base", className)}>{children}</DrawerTitle>
  );
};

// ─── Description ───────────────────────────────────────────────

QuickActionDrawer.Description = function QuickActionDescriptionComponent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DrawerDescription className={cn("text-sm", className)}>
      {children}
    </DrawerDescription>
  );
};

// ─── Body (scrollable) ─────────────────────────────────────────

QuickActionDrawer.Body = function QuickActionBodyComponent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-4 py-4", className)}>
      {children}
    </div>
  );
};

// ─── Footer ────────────────────────────────────────────────────

QuickActionDrawer.Footer = function QuickActionFooterComponent({
  children,
  className,
  bordered = true,
}: {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}) {
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
