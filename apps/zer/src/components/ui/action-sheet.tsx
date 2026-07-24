"use client";

import { Drawer } from "@base-ui/react/drawer";
import type * as React from "react";
import { cn } from "@/lib/utils";

export interface ActionSheetAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Grouped list of action buttons. */
  actions: ActionSheetAction[];
  /** Optional destructive action shown below the main list as a separate block. */
  destructiveAction?: ActionSheetAction & { label: string };
  className?: string;
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  destructiveAction,
  className,
}: ActionSheetProps) {
  return (
    <Drawer.Root swipeDirection="down" open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop
          className={cn(
            "[--backdrop-opacity:0.4] dark:[--backdrop-opacity:0.7]",
            "fixed inset-0 min-h-dvh bg-black",
            "opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))]",
            "transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            "data-swiping:duration-0",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
            "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            "supports-[-webkit-touch-callout:none]:absolute",
          )}
        />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
          <Drawer.Popup
            className={cn(
              // Layout
              "pointer-events-none flex w-full max-w-[20rem] flex-col gap-3",
              "px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
              "outline-none",
              // Animation
              "[transform:translateY(var(--drawer-swipe-movement-y))]",
              "transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
              "data-swiping:select-none",
              "data-starting-style:[transform:translateY(calc(100%+1rem+2px))]",
              "data-ending-style:[transform:translateY(calc(100%+1rem+2px))]",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              className,
            )}
          >
            <Drawer.Content
              className={cn(
                // Main actions surface
                "pointer-events-auto overflow-hidden",
                "border border-border bg-white text-foreground",
                "shadow-[0.25rem_0.25rem_0] shadow-black/12",
                "dark:border-white dark:bg-popover dark:text-popover-foreground dark:shadow-none",
              )}
            >
              {/* Screen-reader accessible heading */}
              {title && (
                <Drawer.Title
                  className={cn(
                    "px-5 pt-3 pb-1 text-sm font-semibold",
                    "border-b border-border dark:border-white",
                  )}
                >
                  {title}
                </Drawer.Title>
              )}
              {description && (
                <Drawer.Description
                  className={cn(
                    "px-5 pb-2 text-xs text-muted-foreground",
                    "border-b border-border dark:border-white",
                  )}
                >
                  {description}
                </Drawer.Description>
              )}

              <ul className="m-0 list-none p-0" role="menu">
                {actions.map((action, index) => (
                  <li
                    key={index}
                    className={cn(
                      "not-first:border-t border-border dark:border-white",
                    )}
                    role="menuitem"
                  >
                    <button
                      type="button"
                      disabled={action.disabled}
                      onClick={() => {
                        action.onClick();
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex h-10 w-full items-center justify-center",
                        "border-0 bg-transparent px-5",
                        "text-sm text-foreground select-none",
                        "hover:bg-muted active:bg-muted",
                        "focus-visible:bg-muted focus-visible:outline-none",
                        "disabled:text-muted-foreground disabled:cursor-not-allowed",
                        "dark:hover:bg-muted dark:active:bg-muted dark:focus-visible:bg-muted",
                      )}
                    >
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </Drawer.Content>

            {/* Destructive action — separate block */}
            {destructiveAction && (
              <div
                className={cn(
                  "pointer-events-auto overflow-hidden",
                  "border border-border bg-white",
                  "shadow-[0.25rem_0.25rem_0] shadow-black/12",
                  "dark:border-white dark:bg-popover dark:shadow-none",
                )}
              >
                <button
                  type="button"
                  disabled={destructiveAction.disabled}
                  onClick={() => {
                    destructiveAction.onClick();
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex h-10 w-full items-center justify-center",
                    "border-0 bg-transparent px-5",
                    "text-sm text-destructive select-none",
                    "hover:bg-muted active:bg-muted",
                    "focus-visible:bg-muted focus-visible:outline-none",
                    "disabled:text-muted-foreground disabled:cursor-not-allowed",
                    "dark:hover:bg-muted dark:active:bg-muted dark:focus-visible:bg-muted",
                  )}
                >
                  {destructiveAction.label}
                </button>
              </div>
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
