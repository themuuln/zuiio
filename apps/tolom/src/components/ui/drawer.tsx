"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Context for close animation ──────────────────────────────
interface DrawerContextValue {
  closing: boolean;
  showSwipeHandle: boolean;
}

const DrawerContext = React.createContext<DrawerContextValue>({
  closing: false,
  showSwipeHandle: false,
});

function useDrawerContext() {
  return React.useContext(DrawerContext);
}

// ── Root ─────────────────────────────────────────────────────
function Drawer({
  swipeDirection = "right",
  showSwipeHandle = false,
  onOpenChange,
  open: externalOpen,
  ...props
}: DrawerPrimitive.Root.Props & { showSwipeHandle?: boolean }) {
  const [closing, setClosing] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenChange: DrawerPrimitive.Root.Props["onOpenChange"] = (
    nextOpen,
    event,
  ) => {
    if (!nextOpen && externalOpen && !closing) {
      setClosing(true);
      timerRef.current = setTimeout(() => {
        setClosing(false);
        timerRef.current = null;
        onOpenChange?.(false, event);
      }, 300);
    } else {
      onOpenChange?.(nextOpen, event);
    }
  };

  const actualOpen = externalOpen || closing;

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <DrawerContext.Provider value={{ closing, showSwipeHandle }}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        swipeDirection={swipeDirection}
        open={actualOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

// ── Trigger ──────────────────────────────────────────────────
function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

// ── Portal ───────────────────────────────────────────────────
function DrawerPortal(props: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

// ── Close ────────────────────────────────────────────────────
function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

// ── Backdrop ─────────────────────────────────────────────────
function DrawerBackdrop({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 data-closing:opacity-0 transition-opacity duration-300 ease-out data-ending-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

// ── Viewport ─────────────────────────────────────────────────
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

// ── Indent Background ────────────────────────────────────────
function DrawerIndentBackground({
  className,
  ...props
}: DrawerPrimitive.IndentBackground.Props) {
  return (
    <DrawerPrimitive.IndentBackground
      data-slot="drawer-indent-bg"
      className={cn(
        "absolute inset-0 rounded-[var(--drawer-radius,inherit)] bg-[var(--drawer-indent-bg,var(--color-bg))] transition-[background-color,transform,opacity] duration-300 data-nested-drawer-open:bg-[var(--drawer-indent-bg)] data-nested-drawer-open:scale-[calc(1-0.05*var(--nested-drawers))] data-nested-drawer-open:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

// ── Indent ───────────────────────────────────────────────────
function DrawerIndent({ className, ...props }: DrawerPrimitive.Indent.Props) {
  return (
    <DrawerPrimitive.Indent
      data-slot="drawer-indent"
      className={cn(
        "pointer-events-auto relative flex h-full min-w-[20rem] flex-col bg-popover shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}

// ── Content (Popup + inner content) ──────────────────────────
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
  drawerMaxWidth,
  ...props
}: DrawerPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  contentClassName?: string;
  backdropClassName?: string;
  backdropForceRender?: boolean;
  hideBackdrop?: boolean;
  viewportClassName?: string;
  direction?: "right" | "bottom";
  /** Raw CSS value for max-width, applied via <style> tag + data attribute */
  drawerMaxWidth?: string;
}) {
  const { closing, showSwipeHandle } = useDrawerContext();
  const popupSizeId = React.useId().replace(/:/g, "_");
  const sizeStyleTag = drawerMaxWidth
    ? `[data-dw="${popupSizeId}"]{max-width:${drawerMaxWidth}!important;--drawer-max-w:${drawerMaxWidth}}`
    : undefined;

  return (
    <DrawerPortal>
      {drawerMaxWidth && (
        <style
          data-dw-style={popupSizeId}
          dangerouslySetInnerHTML={{ __html: sizeStyleTag ?? "" }}
        />
      )}
      {!hideBackdrop && (
        <DrawerBackdrop
          className={backdropClassName}
          forceRender={backdropForceRender}
        />
      )}
      <DrawerViewport className={viewportClassName} direction={direction}>
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-closing={closing ? "" : undefined}
          data-dw={drawerMaxWidth ? popupSizeId : undefined}
          className={cn(
            "pointer-events-auto",
            direction === "bottom"
              ? [
                  "[--bleed:3rem] [--peek:1rem]",
                  "[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]",
                  "[--stack-step:0.05]",
                  "[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))]",
                  "[--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))]",
                  "[--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)]",
                  "[--stack-shrink:calc(1-var(--stack-scale))]",
                  "[--stack-height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]",
                  "relative -mx-px -mb-[3rem] w-[calc(100%+2px)] max-h-[calc(80vh+3rem)]",
                  "[height:var(--drawer-height,auto)]",
                  "[transform-origin:50%_calc(100%-var(--bleed))]",
                  "[transform:translateY(calc(var(--drawer-swipe-movement-y)-var(--stack-peek-offset)))_scale(var(--stack-scale))]",
                  "transition-transform duration-300 ease-out",
                  "data-swiping:transition-none",
                  "[animation:drawer-slide-in-bottom_300ms_ease-out]",
                  "data-closing:translate-y-full data-closing:[animation:none]",
                  "data-ending-style:translate-y-full data-ending-style:[animation:none]",
                  "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]",
                ].join(" ")
              : [
                  "[--bleed:3rem] [--peek:3rem]",
                  "[--stack-step:0.05]",
                  "[--stack-peek-offset:max(0px,calc((var(--nested-drawers))*var(--peek)))]",
                  "[--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))]",
                  "[--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--drawer-swipe-progress))),1)]",
                  "relative flex h-full w-[var(--drawer-max-w,fit-content)] min-w-[20rem] max-w-[var(--drawer-max-w,90vw)]",
                  "[transform-origin:calc(100%-var(--bleed))_50%]",
                  "[transform:translateX(calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)))_scale(var(--stack-scale))]",
                  "transition-transform duration-300 ease-out",
                  "data-swiping:transition-none",
                  "[animation:drawer-slide-in-right_300ms_ease-out]",
                  "data-closing:translate-x-full data-closing:[animation:none]",
                  "data-ending-style:translate-x-full data-ending-style:[animation:none]",
                  "data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]",
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
            {direction === "bottom" && showSwipeHandle && (
              <span className="mx-auto mt-2 block h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            )}
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

// ── Simple structural components ─────────────────────────────
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1 p-4 text-left shrink-0", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "flex flex-col-reverse gap-2 p-4 border-t border-border shrink-0 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-sm", className)}
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

function DrawerProvider(props: DrawerPrimitive.Provider.Props) {
  return <DrawerPrimitive.Provider data-slot="drawer-provider" {...props} />;
}

function DrawerSwipeArea({
  className,
  ...props
}: DrawerPrimitive.SwipeArea.Props) {
  return (
    <DrawerPrimitive.SwipeArea
      data-slot="drawer-swipe-area"
      className={cn("fixed inset-y-0 z-50 w-4 touch-none", className)}
      {...props}
    />
  );
}

function DrawerVirtualKeyboardProvider(
  props: DrawerPrimitive.VirtualKeyboardProvider.Props,
) {
  return (
    <DrawerPrimitive.VirtualKeyboardProvider
      data-slot="drawer-vk-provider"
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
