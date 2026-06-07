"use client";

import * as React from "react";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";

// ── Direction mapping (Vaul → Base UI) ────────────────────────
// Vaul: direction="bottom" means drawer is at bottom, user swipes down
// Base UI: swipeDirection="down" means user swipes down to dismiss
// They describe the same UX but from different perspectives.

type VaulDirection = "bottom" | "top" | "left" | "right";

function directionToSwipeDirection(direction?: VaulDirection) {
  switch (direction) {
    case "top":
      return "up" as const;
    case "left":
      return "right" as const;
    case "right":
      return "left" as const;
    default:
      return "down" as const;
  }
}

// ── Root ──────────────────────────────────────────────────────

interface DrawerProps
  extends Omit<React.ComponentProps<typeof BaseDrawer.Root>, "swipeDirection"> {
  /** Vaul-compatible direction prop. Maps to Base UI swipeDirection internally. */
  direction?: VaulDirection;
}

function Drawer({ direction = "bottom", children, ...props }: DrawerProps) {
  return (
    <BaseDrawer.Root
      swipeDirection={directionToSwipeDirection(direction)}
      data-slot="drawer"
      {...props}
    >
      {children}
    </BaseDrawer.Root>
  );
}

// ── Trigger ───────────────────────────────────────────────────

interface DrawerTriggerProps
  extends React.ComponentProps<typeof BaseDrawer.Trigger> {
  /** Radix-compatible asChild prop. Maps to Base UI render prop. */
  asChild?: boolean;
}

function DrawerTrigger({
  asChild,
  render,
  children,
  ...props
}: DrawerTriggerProps) {
  // Base UI's `render` prop works like Radix's `asChild`
  // When asChild is true, use the single child as the render target
  if (asChild && React.isValidElement(children)) {
    return <BaseDrawer.Trigger render={children} {...props} />;
  }
  return (
    <BaseDrawer.Trigger render={render} {...props}>
      {children}
    </BaseDrawer.Trigger>
  );
}

// ── Portal ────────────────────────────────────────────────────

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof BaseDrawer.Portal>) {
  return <BaseDrawer.Portal data-slot="drawer-portal" {...props} />;
}

// ── Close ─────────────────────────────────────────────────────

function DrawerClose({
  render,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Close> & {
  asChild?: boolean;
  render?: React.ComponentProps<typeof BaseDrawer.Close>["render"];
}) {
  return (
    <BaseDrawer.Close data-slot="drawer-close" render={render} {...props}>
      {children}
    </BaseDrawer.Close>
  );
}

// ── Backdrop (was Overlay) ────────────────────────────────────

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Backdrop>) {
  return (
    <BaseDrawer.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

// ── Content (Portal + Backdrop + Viewport + Popup) ────────────

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Popup>) {
  return (
    <BaseDrawer.Portal data-slot="drawer-portal">
      <DrawerOverlay />
      <BaseDrawer.Viewport className="fixed inset-0 z-50">
        <BaseDrawer.Popup
          data-slot="drawer-content"
          className={cn(
            "group/drawer-content fixed z-50 flex h-auto flex-col bg-popover text-sm text-popover-foreground data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:mt-24 data-[swipe-direction=down]:max-h-[80vh] data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=down]:border-t data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:left-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:rounded-r-xl data-[swipe-direction=right]:border-r data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:right-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:rounded-l-xl data-[swipe-direction=left]:border-l data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:rounded-b-xl data-[swipe-direction=up]:border-b data-[swipe-direction=right]:sm:max-w-sm data-[swipe-direction=left]:sm:max-w-sm",
            className,
          )}
          {...props}
        >
          <BaseDrawer.Content className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mx-auto mt-4 hidden h-1 w-[100px] shrink-0 rounded-full bg-muted group-data-[swipe-direction=down]/drawer-content:block [[data-fullscreen]>&]:hidden" />
            {children}
          </BaseDrawer.Content>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

// ── Header ────────────────────────────────────────────────────

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[swipe-direction=down]/drawer-content:text-center group-data-[swipe-direction=up]/drawer-content:text-center md:gap-0.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

// ── Footer ────────────────────────────────────────────────────

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

// ── Title ─────────────────────────────────────────────────────

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Title>) {
  return (
    <BaseDrawer.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

// ── Description ───────────────────────────────────────────────

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Description>) {
  return (
    <BaseDrawer.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
