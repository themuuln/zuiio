"use client";
import type * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

/**
 * Dialog root component.
 * Wraps Base UI's Dialog.Root with consistent styling.
 */
function Dialog({ onOpenChange, ...props }: DialogPrimitive.Root.Props) {
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      onOpenChange={onOpenChange}
      {...props}
    />
  );
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Dialog overlay/backdrop.
 * Uses data-nested-dialog-open to dim the parent when a child dialog opens.
 * Child dialogs automatically suppress their backdrops via Base UI.
 */
function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-40 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        // Dim the overlay when a child dialog is open
        "after:absolute after:inset-0 after:bg-black/5 after:opacity-0 after:pointer-events-none after:transition-opacity after:duration-100 data-nested-dialog-open:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Dialog content/popup.
 * Uses Base UI's --nested-dialogs CSS variable for automatic:
 * - Position offset (dialogs stack with vertical offset)
 * - Scale reduction (parent dialogs shrink slightly)
 * - Z-index management (Base UI handles stacking automatically)
 */
function DialogContent({
  children,
  showCloseButton = true,
  className,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Base positioning + z-index above backdrop
          // pointer-events: none so backdrop clicks pass through to Dialog.Root's outside-press handler
          "fixed left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm pointer-events-none",
          // Nested dialog positioning: offset vertically based on nesting level
          "top-[calc(50%+1.25rem*var(--nested-dialogs,0))]",
          "-translate-y-[calc(50%-1.25rem*var(--nested-dialogs,0))]",
          // Scale down parent dialogs when nested
          "scale-[calc(1-0.1*var(--nested-dialogs,0))]",
          // Transitions for smooth nesting animation
          "transition-[top,scale,opacity] ease-out",
          // Entry/exit animations
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          // Dim overlay on parent when child is open
          "after:absolute after:inset-0 after:bg-black/5 after:opacity-0 after:pointer-events-none after:transition-opacity after:duration-100 after:ease-out data-nested-dialog-open:after:opacity-100",
          className,
        )}
        {...props}
      >
        {/* pointer-events: auto restores click interaction inside the popup */}
        <div className="pointer-events-auto">{children}</div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2 pointer-events-auto"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogFooter({
  showCloseButton = false,
  children,
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
      )}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
