"use client";

import * as React from "react";
import {
  Drawer,
  type DrawerHandle,
  DrawerIndent,
  DrawerIndentBackground,
  DrawerOverlay,
  DrawerPanelContent,
  DrawerPopup,
  DrawerPortal,
  DrawerProvider,
  DrawerTrigger,
  DrawerViewport,
} from "@/components/ui/drawer";
import { DrawerHeader } from "@/components/ui/drawer-header";
import { cn } from "@/lib/utils";

interface BottomSheetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  /** Height of the drawer. Defaults to "90dvh". */
  height?: string;
  /** The trigger element, if using trigger-based opening. */
  trigger?: React.ReactNode;
  /** Fixed footer slot at the bottom of the drawer. */
  footer?: React.ReactNode;
  /**
   * Handle for detached triggers created via `Drawer.createHandle()` from Base UI.
   */
  handle?: DrawerHandle;
  /**
   * Determines if the drawer enters a modal state when open.
   * @default true
   */
  modal?: boolean | "trap-focus";
  /**
   * Prevent the drawer from closing on outside presses.
   * @default false
   */
  disablePointerDismissal?: boolean;
}

export function BottomSheetDrawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
  height = "90dvh",
  trigger,
  footer,
  handle,
  modal = true,
  disablePointerDismissal = false,
}: BottomSheetDrawerProps) {
  const bleedPadding = "px-6";

  return (
    <DrawerProvider>
      {/* IndentBackground: scales down when any drawer in provider is open */}
      <DrawerIndentBackground className="fixed inset-0 bg-black/10 transition-all duration-300 data-[active]:bg-black/20" />

      {/* Indent: the wrapper that scales when drawer is open */}
      <DrawerIndent className="transition-all duration-300 data-[active]:scale-[0.97] data-[active]:opacity-80">
        <Drawer
          swipeDirection="down"
          open={open}
          onOpenChange={onOpenChange}
          handle={handle}
          modal={modal}
          disablePointerDismissal={disablePointerDismissal}
          snapPoints={[0.9]}
        >
          {trigger && (
            <DrawerTrigger
              render={(props) => {
                const { children: _, ...triggerProps } = props;
                if (React.isValidElement(trigger)) {
                  return React.cloneElement(trigger, triggerProps);
                }
                return (
                  <button {...triggerProps} type="button">
                    {trigger}
                  </button>
                );
              }}
            >
              {trigger}
            </DrawerTrigger>
          )}
          <DrawerPortal>
            <DrawerOverlay className="[--backdrop-opacity:0.1] z-40 fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] dark:[--backdrop-opacity:0.4]" />
            <DrawerViewport className="[--viewport-padding:0px] z-50 fixed inset-0 flex items-end justify-center p-(--viewport-padding)">
              <DrawerPopup
                className={cn(
                  "[--bleed:0px] w-full border-t border-border bg-white text-foreground outline-none shadow-lg overscroll-contain touch-auto",
                  "[transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
                  "data-swiping:select-none",
                  "data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)]",
                  "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
                  "rounded-t-2xl dark:bg-popover dark:text-popover-foreground dark:shadow-none",
                  "overflow-hidden",
                  className,
                )}
                style={{ height } as React.CSSProperties}
              >
                <DrawerPanelContent className="mx-auto w-full flex flex-col h-full min-w-0 overflow-x-hidden">
                  {/* Header */}
                  {title && (
                    <div
                      className={cn(
                        "shrink-0 bg-card border-b border-border",
                        bleedPadding,
                        "py-4",
                      )}
                    >
                      <DrawerHeader title={title} description={description} />
                    </div>
                  )}

                  {/* Scrollable content */}
                  <div
                    className={cn(
                      "flex-1 overflow-y-auto min-h-0",
                      bleedPadding,
                      "py-4",
                    )}
                  >
                    {children}
                  </div>

                  {/* Fixed footer */}
                  {footer && (
                    <div
                      className={cn(
                        "shrink-0 bg-card border-t border-border",
                        bleedPadding,
                        "py-4",
                      )}
                    >
                      {footer}
                    </div>
                  )}
                </DrawerPanelContent>
              </DrawerPopup>
            </DrawerViewport>
          </DrawerPortal>
        </Drawer>
      </DrawerIndent>
    </DrawerProvider>
  );
}
