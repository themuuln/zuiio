"use client";

import type React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from "@/components/ui/drawer";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

type DrawerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
type DetailDrawerVariant = "detail" | "quick";

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
  /** Width of the drawer on desktop (default: "lg" for detail, "sm" for quick) */
  size?: DrawerSize;
  className?: string;
  /** Whether clicking the backdrop closes the drawer (default: true) */
  modal?: boolean;
  /**
   * "detail" (default) — full-featured drawer with Divider/Section sub-components.
   * "quick" — compact drawer for quick action flows (choose, confirm, pick from a list).
   */
  variant?: DetailDrawerVariant;
  /** Force backdrop to render even when this drawer is nested inside another drawer */
  backdropForceRender?: boolean;
  /** Swipe direction for dismissing the drawer (default: "right") */
  swipeDirection?: "up" | "down" | "left" | "right";
  /**
   * Content rendered inside the Drawer.Root but outside DrawerContent.
   * Use for nested drawers — they become React children, enabling
   * Base UI's context-based nesting detection.
   */
  nestedContent?: React.ReactNode;
  /** Passed to DrawerContent's contentClassName — extends the default layout classes */
  contentClassName?: string;
  /** Passed to DrawerContent's viewportClassName — for full-screen viewport padding */
  viewportClassName?: string;
  /** Passed to DrawerContent's backdropClassName — custom class for the backdrop overlay */
  backdropClassName?: string;
  /**
   * Direction the drawer slides in from.
   * `right` (default): slides from right edge.
   * `bottom`: slides up from bottom edge (Dribbble-style).
   * @default "right"
   */
  direction?: "right" | "bottom";
}

export function DetailDrawer({
  open,
  onOpenChange,
  children,
  size,
  className,
  modal = true,
  variant = "detail",
  direction = "right",
  backdropForceRender,
  swipeDirection,
  nestedContent,
  contentClassName,
  viewportClassName,
  backdropClassName,
}: DetailDrawerRootProps) {
  const resolvedSize = size ?? (variant === "quick" ? "sm" : "lg");
  if (variant === "quick" && !["sm", "md"].includes(resolvedSize)) {
    logger.warn(
      `DetailDrawer variant="quick" does not support size="${resolvedSize}". Defaulting to "sm".`,
    );
  }

  const effectiveSize =
    variant === "quick" && !["sm", "md"].includes(resolvedSize)
      ? "sm"
      : resolvedSize;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={direction === "bottom" ? "down" : (swipeDirection ?? "right")}
      modal={modal}
    >
      <DrawerVirtualKeyboardProvider>
        <DrawerContent
          showCloseButton={false}
          className={cn(drawerSizeClasses[effectiveSize], className)}
          contentClassName={cn(
            "flex flex-col p-0 gap-0 overflow-hidden",
            contentClassName,
          )}
          viewportClassName={viewportClassName}
          backdropForceRender={backdropForceRender}
          backdropClassName={backdropClassName}
        >
          {children}
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
      {nestedContent}
    </Drawer>
  );
}

// ── Header ────────────────────────────────────────────────────

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

// ── Title ─────────────────────────────────────────────────────

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

// ── Description ───────────────────────────────────────────────

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

// ── Body ──────────────────────────────────────────────────────

interface DetailDrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

DetailDrawer.Body = function DetailDrawerBodyComponent({
  children,
  className,
}: DetailDrawerBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-3 py-3", className)}>
      {children}
    </div>
  );
};

// ── Footer ────────────────────────────────────────────────────

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
        "shrink-0 py-3 px-4",
        bordered && "border-t border-border",
        className,
      )}
    >
      {children}
    </DrawerFooter>
  );
};

// ── Footer Actions ──────────────────────────────────────────

interface DetailDrawerFooterActionsProps {
  children: React.ReactNode;
  className?: string;
  /** Justification (default: "between") */
  justify?: "between" | "end" | "start";
}

DetailDrawer.FooterActions = function DetailDrawerFooterActionsComponent({
  children,
  className,
  justify = "between",
}: DetailDrawerFooterActionsProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        justify === "between" && "justify-between",
        justify === "end" && "justify-end",
        justify === "start" && "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
};

// ── Divider ───────────────────────────────────────────────────

interface DetailDrawerDividerProps {
  className?: string;
}

DetailDrawer.Divider = function DetailDrawerDividerComponent({
  className,
}: DetailDrawerDividerProps) {
  return <div className={cn("border-t border-border my-4", className)} />;
};

// ── Section ───────────────────────────────────────────────────

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
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h4>
      )}
      {children}
    </div>
  );
};
