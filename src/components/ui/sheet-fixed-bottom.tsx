"use client";

import type React from "react";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom bar for sheets — sits outside the scrollable body,
 * pinned to the bottom of the sheet with a top border.
 *
 * Usage inside a flex-col sheet (like DetailSheet):
 * ```tsx
 * <DetailSheet>
 *   <DetailSheet.Header>...</DetailSheet.Header>
 *   <DetailSheet.Body>...scrollable content...</DetailSheet.Body>
 *   <SheetFixedBottom>
 *     <Button>Cancel</Button>
 *     <Button>Save</Button>
 *   </SheetFixedBottom>
 * </DetailSheet>
 * ```
 */
interface SheetFixedBottomProps {
  children: React.ReactNode;
  className?: string;
  /** Show top border (default: true) */
  bordered?: boolean;
}

export function SheetFixedBottom({
  children,
  className,
  bordered = true,
}: SheetFixedBottomProps) {
  return (
    <div
      className={cn(
        "shrink-0 p-4",
        bordered && "border-t border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
