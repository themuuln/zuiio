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
        "fixed inset-0 z-50 bg-black/30 transition-opacity duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm backdrop-blur-sm",
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
            direction === "bottom"
              ? [
                  "pointer-events-auto",
                  "[--bleed:3rem] [--peek:1rem]",
                  "[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]",
                  "[--stack-step:0.05]",
                  "[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
                  "[--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))]",
                  "[--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
                  "[--stack-shrink:calc(1-var(--stack-scale))]",
                  "[--stack-height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]",
                  "group/drawer-popup w-full -mb-[3rem] border-t border-border",
                  "[height:var(--drawer-height,auto)]",
                  "[transform-origin:50%_calc(100%-var(--bleed))]",
                  "[transform:translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)))_scale(var(--stack-scale))]",
                  "transition-transform duration-300 ease-out",
                  "data-swiping:transition-none",
                  "data-nested-drawer-open:brightness-95",
                  "data-starting-style:translate-y-full data-ending-style:translate-y-full",
                  "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]",
                ].join(" ")
              : [
                  "pointer-events-auto",
                  "[--bleed:3rem] [--peek:3rem]",
                  "[--stack-step:0.05]",
                  "[--stack-peek-offset:max(0px,calc((var(--nested-drawers))*var(--peek)))]",
                  "[--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))]",
                  "[--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--drawer-swipe-progress))),1)]",
                  "group/drawer-popup relative flex h-full w-[var(--drawer-max-w,fit-content)] min-w-[20rem] max-w-[var(--drawer-max-w,90vw)]",
                  "[transform-origin:calc(100%-var(--bleed))_50%]",
                  "[transform:translateX(calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)))_scale(var(--stack-scale))]",
                  "transition-transform duration-300 ease-out",
                  "data-swiping:transition-none",
                  "data-nested-drawer-open:brightness-95",
                  "data-starting-style:translate-x-full data-ending-style:translate-x-full",
                  "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]",
                  "supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6",
                ].join(" "),
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

// ── Indent Background ────────────────────────────────────────
function DrawerIndentBackground({
  className,
  ...props
}: DrawerPrimitive.IndentBackground.Props) {
  return (
    <DrawerPrimitive.IndentBackground
      data-slot="drawer-indent-bg"
      className={(state) =>
        cn(
          "absolute inset-0 rounded-[var(--drawer-radius,inherit)] bg-[var(--drawer-indent-bg,var(--color-bg))] transition-[background-color,transform,opacity] duration-300 data-nested-drawer-open:bg-[var(--drawer-indent-bg)] data-nested-drawer-open:scale-[calc(1-0.05*var(--nested-drawers))] data-nested-drawer-open:opacity-90",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

// ── Indent ───────────────────────────────────────────────────
function DrawerIndent({ className, ...props }: DrawerPrimitive.Indent.Props) {
  return (
    <DrawerPrimitive.Indent
      data-slot="drawer-indent"
      className={(state) =>
        cn(
          "pointer-events-auto relative flex h-full min-w-[20rem] flex-col bg-popover shadow-2xl",
          typeof className === "function" ? className(state) : className,
        )
      }
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
  DrawerIndent,
  DrawerIndentBackground,
  DrawerPortal,
  DrawerProvider,
  DrawerRoot as Drawer,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
};
