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
        "fixed inset-0 z-50 bg-black/20 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[280ms] ease-[cubic-bezier(0.32,0.82,0,1.015)] data-swiping:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
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
            direction === "bottom"
              ? "[--bleed:3rem] [--peek:1rem] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-step:0.05] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))] relative -mx-px -mb-[3rem] w-[calc(100%+2px)] max-h-[calc(80vh+3rem)] [height:var(--drawer-height,auto)] [transform-origin:50%_calc(100%-var(--bleed))] [transform:translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height))))_scale(var(--stack-scale))] [transition:transform_450ms_cubic-bezier(0.32,0.72,0,1),height_450ms_cubic-bezier(0.32,0.72,0,1),opacity_450ms_cubic-bezier(0.32,0.72,0,1)] group/popup pointer-events-auto will-change-transform data-swiping:select-none data-swiping:duration-0 data-nested-drawer-swiping:duration-0 data-starting-style:translate-y-full data-ending-style:translate-y-full data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-nested-drawer-open:h-[calc(var(--stack-height)+var(--bleed))] data-nested-drawer-open:overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:bg-transparent after:content-[''] after:transition-[background-color] after:duration-[450ms] after:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested-drawer-open:after:bg-black/5 rounded-t-2xl"
              : "[--bleed:3rem] [--peek:3rem] [--stack-step:0.05] [--stack-peek-offset:max(0px,calc((var(--nested-drawers))*var(--peek)))] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--drawer-swipe-progress))),1)] relative flex h-full w-fit min-w-[20rem] max-w-[90vw] [transform-origin:calc(100%-var(--bleed))_50%] [transform:translateX(calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)))_scale(var(--stack-scale))] transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.82,0,1.015)] data-swiping:transition-none data-starting-style:translate-x-full data-ending-style:translate-x-full data-ending-style:duration-[calc(var(--drawer-swipe-strength)*280ms)] data-nested-drawer-open:overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:bg-transparent after:content-[''] after:transition-[background-color] after:duration-[450ms] after:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested-drawer-open:after:bg-black/5 group/popup pointer-events-auto will-change-transform",
            className,
          )}
          {...props}
        >
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              direction === "bottom"
                ? "relative flex min-h-0 w-full flex-col gap-2 overflow-hidden border-t border-border/80 bg-popover text-sm text-popover-foreground shadow-2xl group-data-nested-drawer-open/popup:border-y"
                : "relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden border-l border-border/80 bg-popover text-sm text-popover-foreground shadow-2xl group-data-nested-drawer-open/popup:border-y",
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

function DrawerIndent({ className, ...props }: DrawerPrimitive.Indent.Props) {
  return (
    <DrawerPrimitive.Indent
      data-slot="drawer-indent"
      className={className}
      {...props}
    />
  );
}

function DrawerSwipeArea({
  className,
  ...props
}: DrawerPrimitive.SwipeArea.Props) {
  return (
    <DrawerPrimitive.SwipeArea
      data-slot="drawer-swipe-area"
      className={cn("fixed inset-0 z-40", className)}
      {...props}
    />
  );
}

function DrawerVirtualKeyboardProvider({
  ...props
}: DrawerPrimitive.VirtualKeyboardProvider.Props) {
  return (
    <DrawerPrimitive.VirtualKeyboardProvider
      data-slot="drawer-virtual-keyboard-provider"
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
  DrawerSwipeArea,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  DrawerVirtualKeyboardProvider,
};
