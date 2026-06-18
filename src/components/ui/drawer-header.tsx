import { X } from "@phosphor-icons/react";
import { Drawer } from "@base-ui/react/drawer";
import type * as React from "react";

/**
 * Standard header for drawers: title + optional description + close button.
 * Must be used inside a Drawer.Content.
 */
export function DrawerHeader({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 shrink-0">
      <div className="min-w-0">
        <Drawer.Title className="text-lg font-semibold tracking-tight">
          {title}
        </Drawer.Title>
        {description && (
          <Drawer.Description className="text-sm text-muted-foreground mt-0.5">
            {description}
          </Drawer.Description>
        )}
      </div>
      <Drawer.Close className="flex size-8 shrink-0 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
        <X className="size-4" />
      </Drawer.Close>
    </div>
  );
}
