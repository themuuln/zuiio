"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Slot } from "radix-ui";
import type * as React from "react";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { cn } from "@/lib/utils";

interface DrawerLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Width of the drawer panel. Defaults to 28rem. */
  panelWidth?: string;
  /** The trigger element, if using trigger-based opening. */
  trigger?: React.ReactNode;
  className?: string;
  /** Whether this drawer is nested inside another drawer. Reduces backdrop and adds visual hierarchy. */
  nested?: boolean;
  /**
   * Handle for detached triggers created via `Drawer.createHandle()`.
   * Lets you control the drawer from a trigger placed outside `<DrawerLayout>`.
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
  /** When provided, renders a full-width header strip with bg-card and border-b. */
  title?: string;
  /** Optional description for the header. Only used when `title` is set. */
  description?: string;
  /** When provided, renders a full-width footer strip with bg-card and border-t. */
  footer?: React.ReactNode;
}

export function DrawerLayout({
  open,
  onOpenChange,
  children,
  panelWidth = "28rem",
  trigger,
  className,
  nested = false,
  handle,
  modal = true,
  disablePointerDismissal = false,
  title,
  description,
  footer,
}: DrawerLayoutProps) {
  const hasStructuredLayout = !!(title || footer);
  const bleedPadding =
    "pr-[calc(1.5rem+3rem)] supports-[-webkit-touch-callout:none]:pr-6";

  return (
    <Drawer.Root
      swipeDirection="right"
      open={open}
      onOpenChange={onOpenChange}
      handle={handle}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
    >
      {trigger && (
        <Drawer.Trigger render={<Slot.Root />}>{trigger}</Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Backdrop
          className={cn(
            "[--bleed:3rem] fixed inset-0 min-h-dvh bg-black transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute",
            nested
              ? "[--backdrop-opacity:0.04] z-[60] dark:[--backdrop-opacity:0.15]"
              : "[--backdrop-opacity:0.1] z-40 dark:[--backdrop-opacity:0.4]",
            "opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))]",
          )}
        />
        <Drawer.Viewport
          className={cn(
            "[--viewport-padding:0px] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)",
            nested ? "z-[70]" : "z-50",
            "supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem]",
          )}
        >
          <Drawer.Popup
            className={cn(
              "[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full -mr-[3rem] border-l border-border bg-white text-foreground outline-none overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none",
              `w-[calc(${panelWidth}+3rem)] max-w-[calc(100vw-3rem+3rem)] supports-[-webkit-touch-callout:none]:w-[${panelWidth}] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)]`,
              nested
                ? "shadow-2xl dark:shadow-2xl dark:shadow-black/50"
                : "shadow-lg",
              hasStructuredLayout && "pb-0",
              className,
            )}
          >
            <Drawer.Content className="mx-auto w-full flex flex-col h-full min-w-0 overflow-x-hidden">
              {hasStructuredLayout ? (
                <>
                  {title && (
                    <div
                      className={cn(
                        "shrink-0 bg-card border-b border-border px-6",
                        bleedPadding,
                        "py-4",
                      )}
                    >
                      <DrawerHeader title={title} description={description} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex-1 overflow-y-auto min-h-0 px-6",
                      bleedPadding,
                      "py-6",
                    )}
                  >
                    {children}
                  </div>
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
                </>
              ) : (
                children
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
