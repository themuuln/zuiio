"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Drawer({
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
        "fixed inset-0 z-50 bg-black/20 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  ...props
}: DrawerPrimitive.Viewport.Props) {
  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      className={cn(
        "fixed inset-0 z-50 flex items-stretch justify-end overflow-hidden p-0",
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
  viewportClassName,
  children,
  showCloseButton = true,
  ...props
}: DrawerPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  contentClassName?: string;
  backdropClassName?: string;
  viewportClassName?: string;
}) {
  return (
    <DrawerPortal>
      <DrawerBackdrop className={backdropClassName} />
      <DrawerViewport className={viewportClassName}>
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          className={cn(
            "relative flex h-full w-full max-w-full [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:transition-none data-starting-style:translate-x-full data-ending-style:translate-x-full data-ending-style:duration-[calc(var(--drawer-swipe-strength)*320ms)] data-[nested-drawer-open]:-translate-x-3 sm:max-w-lg",
            className,
          )}
          {...props}
        >
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              "relative flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-border/80 bg-popover text-sm text-popover-foreground shadow-2xl",
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
                    size="icon-sm"
                  />
                }
              >
                <XIcon />
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
      className={cn("font-heading text-base font-medium", className)}
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

function DrawerIndentBackground({
  className,
  ...props
}: DrawerPrimitive.IndentBackground.Props) {
  return (
    <DrawerPrimitive.IndentBackground
      data-slot="drawer-indent-background"
      className={className}
      {...props}
    />
  );
}

function DrawerIndent({
  className,
  ...props
}: DrawerPrimitive.Indent.Props) {
  return (
    <DrawerPrimitive.Indent
      data-slot="drawer-indent"
      className={className}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerIndent,
  DrawerIndentBackground,
  DrawerPortal,
  DrawerProvider,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
};
