"use client";

import { Drawer } from "@base-ui/react/drawer";
import { X } from "@phosphor-icons/react";
import { Slot } from "radix-ui";
import type * as React from "react";
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
}: SlideInDrawerProps) {
  const content = (
    <>
      <Drawer.Backdrop className="[--backdrop-opacity:0.1] [--bleed:3rem] dark:[--backdrop-opacity:0.4] z-50 fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
      <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] z-50 fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
        <Drawer.Popup
          className={cn(
            `[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-popover dark:text-popover-foreground dark:shadow-none`,
            `w-[calc(${panelWidth}+3rem)] max-w-[calc(100vw-3rem+3rem)] supports-[-webkit-touch-callout:none]:w-[${panelWidth}] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)]`,
            className,
          )}
        >
          <Drawer.Content className="mx-auto w-full">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Drawer.Title className="text-lg font-semibold tracking-tight">
                  {title}
                </Drawer.Title>
                {description && (
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {description}
                  </Drawer.Description>
                )}
              </div>
              <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                <X className="size-4" />
              </Drawer.Close>
            </div>
            {children}
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </>
  );

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <Drawer.Trigger render={<Slot.Root />}>{trigger}</Drawer.Trigger>
      )}
      <Drawer.Portal>{content}</Drawer.Portal>
    </Drawer.Root>
  );
}
