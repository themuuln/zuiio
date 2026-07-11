"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Slot } from "radix-ui";
import type * as React from "react";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { cn } from "@/lib/utils";

interface SlideInDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Width of the drawer panel. Defaults to 28rem. */
  panelWidth?: string;
  /** The trigger element, if using trigger-based opening instead of controlled. */
  trigger?: React.ReactNode;
  /** Fixed footer slot — buttons rendered sticky at the bottom of the drawer. */
  footer?: React.ReactNode;
  /**
   * Handle for detached triggers created via `Drawer.createHandle()`.
   * Lets you control the drawer from a trigger placed outside `<SlideInDrawer>`.
   */
  handle?: Drawer.Handle<unknown>;
  /**
   * Determines if the drawer enters a modal state when open.
   * `true`: focus trapped, scroll locked, pointer interactions disabled outside.
   * `false`: user can interact with the rest of the document.
   * `'trap-focus'`: focus trapped but scroll/pointer remain enabled.
   * @default true
   */
  modal?: boolean | "trap-focus";
  /**
   * Prevent the drawer from closing on outside presses.
   * @default false
   */
  disablePointerDismissal?: boolean;
  /**
   * Direction the drawer slides in from.
   * `right` (default): slides from right edge.
   * `bottom`: slides up from bottom edge (Dribbble-style).
   * @default "right"
   */
  direction?: "right" | "bottom";
}

export function SlideInDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  panelWidth = "28rem",
  trigger,
  footer,
  handle,
  modal = true,
  disablePointerDismissal = false,
  direction = "right",
}: SlideInDrawerProps) {
  const bleedPadding =
    "pr-[calc(1.5rem+3rem)] supports-[-webkit-touch-callout:none]:pr-6";

  const content = (
    <>
      <Drawer.Backdrop className="[--backdrop-opacity:0.1] z-40 [--bleed:3rem] dark:[--backdrop-opacity:0.4] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
      <Drawer.Viewport
        className={cn(
          "[--viewport-padding:0px] z-50 supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex p-(--viewport-padding)",
          direction === "bottom"
            ? "items-end justify-center"
            : "items-stretch justify-end",
        )}
      >
        <Drawer.Popup
          className={cn(
            direction === "bottom"
              ? `[--bleed:0px] w-full h-[90dvh] border-t border-border bg-white text-foreground outline-none shadow-lg overscroll-contain touch-auto [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] rounded-t-2xl dark:bg-popover dark:text-popover-foreground dark:shadow-none overflow-hidden`
              : `[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full -mr-[3rem] border-l border-border bg-white text-foreground outline-none shadow-lg overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:border dark:bg-popover dark:text-popover-foreground dark:shadow-none`,
            direction === "bottom"
              ? "w-full max-w-none"
              : `w-[calc(var(--panel-width)+var(--bleed))] max-w-[calc(100vw-3rem+3rem)] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)]`,
            className,
          )}
          style={
            direction === "bottom"
              ? undefined
              : ({ "--panel-width": panelWidth } as React.CSSProperties)
          }
        >
          <Drawer.Content className="mx-auto w-full flex flex-col h-full min-w-0 overflow-x-hidden">
            {/* Full-width header */}
            <div
              className={cn(
                "shrink-0 bg-card border-b border-border px-6",
                bleedPadding,
                "py-4",
              )}
            >
              <DrawerHeader title={title} description={description} />
            </div>

            {/* Scrollable content area */}
            <div
              className={cn(
                "flex-1 overflow-y-auto min-h-0 px-6",
                bleedPadding,
                "py-6",
              )}
            >
              {children}
            </div>

            {/* Full-width footer */}
            {footer && (
              <div
                className={cn(
                  "shrink-0 bg-card border-t border-border px-6",
                  bleedPadding,
                  "py-4",
                )}
              >
                {footer}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </>
  );

  return (
    <Drawer.Root
      swipeDirection={direction === "bottom" ? "down" : "right"}
      open={open}
      onOpenChange={onOpenChange}
      handle={handle}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
      {...(direction === "bottom" ? { snapPoints: [0.9] } : {})}
    >
      {trigger && (
        <Drawer.Trigger render={<Slot.Root />}>{trigger}</Drawer.Trigger>
      )}
      <Drawer.Portal>{content}</Drawer.Portal>
    </Drawer.Root>
  );
}
