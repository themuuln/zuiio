"use client";

import { XIcon } from "lucide-react";
import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// ── Context ──────────────────────────────────────────────────
// Provides onOpenChange to child sub-components (Header, etc.)
// so they can auto-derive onClose without prop drilling.

interface DetailDrawerContextValue {
  onOpenChange: (open: boolean) => void;
}

const DetailDrawerContext =
  React.createContext<DetailDrawerContextValue | null>(null);

function _useDetailDrawerContext() {
  const ctx = React.useContext(DetailDrawerContext);
  if (!ctx) {
    throw new Error("DetailDrawer.Header must be used within a <DetailDrawer>");
  }
  return ctx;
}

interface DetailDrawerRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Whether clicking the backdrop closes the drawer (default: true) */
  modal?: boolean;
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
  /** Hide the backdrop overlay — use for nested drawers that shouldn't blur the parent */
  hideBackdrop?: boolean;
  /** Passed to DrawerContent's backdropClassName — custom class for the backdrop overlay */
  backdropClassName?: string;
  /**
   * Direction the drawer slides in from.
   * `right` (default): slides from right edge.
   * `bottom`: slides up from bottom edge (Dribbble-style).
   * @default "right"
   */
  direction?: "right" | "bottom";
  /**
   * Width cap applied to the drawer popup.
   * Maps to Tailwind `max-w-*` with `!important` to override the base 90vw.
   * `undefined` (default) keeps the base 90vw — backward compatible.
   */
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "7xl"
    | "1/2"
    | "full";
}

/** Raw CSS values for the drawer max-width — used via inline style
 *  instead of Tailwind arbitrary properties, which Turbopack doesn't
 *  always emit as CSS rules in dev mode. */
const SIZE_VALUE: Record<string, string> = {
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "7xl": "80rem",
  "1/2": "50vw",
  full: "100vw",
};
export function DetailDrawer({
  open,
  onOpenChange,
  children,
  className,
  modal = true,
  direction = "right",
  backdropForceRender,
  hideBackdrop,
  swipeDirection,
  nestedContent,
  contentClassName,
  viewportClassName,
  backdropClassName,
  size,
}: DetailDrawerRootProps) {
  const drawerMaxWidth = size ? SIZE_VALUE[size] : undefined;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={
        direction === "bottom" ? "down" : (swipeDirection ?? "right")
      }
      modal={modal}
    >
      <DrawerVirtualKeyboardProvider>
        <DrawerContent
          data-slot="detail-drawer"
          drawerMaxWidth={drawerMaxWidth}
          showCloseButton={false}
          className={cn(className)}
          contentClassName={cn(
            "flex flex-col p-0 gap-0 overflow-hidden",
            contentClassName,
          )}
          viewportClassName={viewportClassName}
          backdropForceRender={backdropForceRender}
          hideBackdrop={hideBackdrop}
          backdropClassName={backdropClassName}
          direction={direction}
        >
          <DetailDrawerContext.Provider value={{ onOpenChange }}>
            {children}
          </DetailDrawerContext.Provider>
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
      {nestedContent}
    </Drawer>
  );
}

interface DetailDrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Show a bottom border (default: true) */
  bordered?: boolean;
  /** Optional action elements rendered on the right side of the header (e.g. buttons) */
  actions?: React.ReactNode;
  /** Show a close button (X icon) on the right side of the header */
  closeButton?: boolean;
  /**
   * Called when the close button is clicked.
   * If omitted, auto-derives `() => onOpenChange(false)` from parent DetailDrawer context.
   */
  onClose?: () => void;
}

DetailDrawer.Header = function DetailDrawerHeaderComponent({
  children,
  className,
  bordered = true,
  actions,
  closeButton,
  onClose: onCloseProp,
}: DetailDrawerHeaderProps) {
  // Auto-derive onClose from context when not explicitly provided
  const ctx = React.useContext(DetailDrawerContext);
  const onClose =
    onCloseProp ?? (ctx ? () => ctx.onOpenChange(false) : undefined);

  const rightActions = closeButton ? (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <XIcon className="size-4" />
      <span className="sr-only">Close</span>
    </button>
  ) : null;

  const hasActions = closeButton || actions;

  return (
    <DrawerHeader
      className={cn(
        "shrink-0 p-4",
        bordered && "border-b border-border",
        className,
      )}
    >
      {hasActions ? (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">{children}</div>
          <div className="shrink-0 flex items-center gap-1">
            {actions}
            {rightActions}
          </div>
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
