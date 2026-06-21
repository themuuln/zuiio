"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Slot } from "radix-ui";
import type * as React from "react";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Snap points — fractions (0-1) as viewport % or px/rem strings. Omit for a single state. */
  snapPoints?: (number | string)[];
  /** Enable virtual keyboard aware scroll when containing form fields. */
  virtualKeyboard?: boolean;
  /** Fixed footer slot rendered below the scrollable content. */
  footer?: React.ReactNode;
  /** Trigger element for uncontrolled usage. */
  trigger?: React.ReactNode;
  /** Max-height CSS value. Defaults to calc(80vh + 3rem). */
  maxHeight?: string;
  /** Gap between snap points to show as peek. Defaults to 1rem. */
  topMargin?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  snapPoints,
  virtualKeyboard = false,
  footer,
  trigger,
  maxHeight = "calc(80dvh + 3rem)",
  topMargin = "1rem",
}: BottomSheetProps) {
  const content = (
    <>
      <Drawer.Backdrop
        className={cn(
          "[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7]",
          "fixed inset-0 min-h-dvh bg-black",
          "opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))]",
          "transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
          "data-swiping:duration-0",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
          "supports-[-webkit-touch-callout:none]:absolute",
        )}
      />
      <Drawer.Viewport
        className="fixed inset-0 flex items-end justify-center"
        style={
          {
            touchAction: virtualKeyboard ? undefined : "none",
          } as React.CSSProperties
        }
      >
        <Drawer.Popup
          className={cn(
            // Base
            "[--bleed:3rem] box-border w-full",
            // Bleed below viewport for drag affordance
            "-mb-[var(--bleed)]",
            // Padding — safe area + bleed at the bottom, extra on sides
            "px-6 pt-4",
            "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+var(--bleed))]",
            // Visual
            "border-t border-border bg-white text-foreground outline-none",
            "shadow-[0_0.25rem_0.25rem] shadow-black/12",
            "overflow-y-auto overscroll-contain",
            // Drag transform — includes snap point offset when applicable
            snapPoints
              ? "[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]"
              : "[transform:translateY(var(--drawer-swipe-movement-y))]",
            // Transitions
            "transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            "data-swiping:select-none data-swiping:duration-0",
            // Starting / ending style
            "data-starting-style:[transform:translateY(calc(100%+2px))]",
            "data-starting-style:shadow-[0.0.25rem_0.25rem_0] data-starting-style:shadow-black/0",
            "data-ending-style:[transform:translateY(calc(100%+2px))]",
            "data-ending-style:shadow-[0.0.25rem_0.25rem_0] data-ending-style:shadow-black/0",
            "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            // Dark mode
            "dark:border-white dark:bg-popover dark:text-popover-foreground dark:shadow-none",
            className,
          )}
          style={
            {
              "--top-margin": topMargin as string,
              maxHeight: snapPoints ? `calc(100dvh - ${topMargin})` : maxHeight,
              paddingBottom: snapPoints
                ? `max(0px, calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement-y)))`
                : undefined,
            } as React.CSSProperties
          }
        >
          {/* Drag handle */}
          <div className="mx-auto mb-4 h-1 w-12 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700" />

          <Drawer.Content
            className={cn(
              "mx-auto flex w-full max-w-lg flex-col",
              snapPoints
                ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
                : "",
            )}
          >
            {title && <DrawerHeader title={title} description={description} />}
            <div
              className={cn(
                "flex-1",
                snapPoints ? "" : "overflow-y-auto min-h-0",
              )}
            >
              {children}
            </div>
            {footer && (
              <div className="mt-4 shrink-0 border-t pt-4">{footer}</div>
            )}
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </>
  );

  const drawer = (
    <Drawer.Root
      swipeDirection="down"
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints as (number | string)[] | undefined}
    >
      {trigger && (
        <Drawer.Trigger render={<Slot.Root />}>{trigger}</Drawer.Trigger>
      )}
      <Drawer.Portal>{content}</Drawer.Portal>
    </Drawer.Root>
  );

  if (virtualKeyboard) {
    return (
      <Drawer.VirtualKeyboardProvider>{drawer}</Drawer.VirtualKeyboardProvider>
    );
  }

  return drawer;
}
