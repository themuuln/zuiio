import { X } from "@phosphor-icons/react";
import type * as React from "react";
import {
  DrawerClose,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

/**
 * Standard header for drawers: title + optional description + close button.
 * Must be used inside a `<DrawerPanelContent>`.
 */
export function DrawerHeader({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 shrink-0">
      <div className="min-w-0">
        <DrawerTitle className="text-lg font-semibold tracking-tight">
          {title}
        </DrawerTitle>
        {description && (
          <DrawerDescription className="text-sm text-muted-foreground mt-0.5">
            {description}
          </DrawerDescription>
        )}
      </div>
      <DrawerClose className="flex size-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
        <X className="size-4" />
      </DrawerClose>
    </div>
  );
}
