"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function DrawerRoot({
  swipeDirection = "right",
  ...props
}: DrawerPrimitive.Root.Props) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      swipeDirection={swipeDirection}
      {...props}
    />
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerBackdrop({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/20 transition-opacity duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  direction = "right",
  ...props
}: DrawerPrimitive.Viewport.Props & { direction?: "right" | "bottom" }) {
  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className={cn(
        "fixed inset-0 z-50 flex overflow-hidden p-0 pointer-events-none",
        direction === "bottom"
          ? "items-end justify-center"
          : "items-stretch justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  contentClassName,
  backdropClassName,
  backdropForceRender,
  hideBackdrop,
  viewportClassName,
  children,
  showCloseButton = true,
  direction = "right",
  ...props
}: DrawerPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  contentClassName?: string;
  backdropClassName?: string;
  backdropForceRender?: boolean;
  hideBackdrop?: boolean;
  viewportClassName?: string;
  direction?: "right" | "bottom";
}) {
  return (
    <DrawerPortal>
      {!hideBackdrop && (
        <DrawerBackdrop
          className={backdropClassName}
          forceRender={backdropForceRender}
        />
      )}
      <DrawerViewport className={viewportClassName} direction={direction}>
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          className={cn(
            "[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] relative flex h-full w-fit min-w-[20rem] max-w-[90vw] [transform-origin:calc(100%-var(--bleed))_50%] [transform:translateX(calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset,0rem)))_scale(var(--stack-scale,1))] transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-starting-style:translate-x-full data-ending-style:translate-x-full data-ending-style:duration-[calc(var(--drawer-swipe-strength)*200ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6",
            direction === "bottom" &&
              "[--bleed:3rem] w-full -mb-[3rem] border-t border-border transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-starting-style:translate-y-full data-ending-style:translate-y-full data-ending-style:duration-[calc(var(--drawer-swipe-strength)*200ms)]",
            className,
          )}
          {...props}
        >
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              "relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden border-l border-border/80 bg-popover text-sm text-popover-foreground shadow-2xl",
              contentClassName,
            )}
          >
            {children}
            {showCloseButton && (
              <DrawerPrimitive.Close
                data-slot="drawer-close"
                render={
                  <Button
                    variant="ghost"
                    className="absolute top-3 right-3 z-10"
                    size="icon"
                  />
                }
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DrawerPrimitive.Close>
            )}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerViewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DrawerProvider({ ...props }: DrawerPrimitive.Provider.Props) {
  return <DrawerPrimitive.Provider data-slot="drawer-provider" {...props} />;
}

export {
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPortal,
  DrawerProvider,
  DrawerRoot as Drawer,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
};
