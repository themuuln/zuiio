"use client";

import type * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type ResponsiveFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Whether to use a centered Dialog on desktop instead of a side Sheet */
  useDialogOnDesktop?: boolean;
  /** Width size for the side Sheet on desktop (default: "sm") */
  sheetSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
};

export function ResponsiveFormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  useDialogOnDesktop = false,
  sheetSize = "xl",
}: ResponsiveFormModalProps) {
  const isMobile = useIsMobile();

  // Mobile view: bottom Drawer (sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <DrawerHeader className="text-left shrink-0">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-xs">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-4 pb-6">
            <div className={cn("py-2", className)}>{children}</div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop view Option A: Centered Dialog
  if (useDialogOnDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden",
            className,
          )}
        >
          <DialogHeader className="p-6 pb-2 shrink-0 text-left">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-sm">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="py-2">{children}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop view Option B: Right Side Sheet (standard TOLOM desktop layout)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size={sheetSize}
        className="flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="p-6 pb-2 shrink-0 text-left">
          <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-sm">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-y-auto px-6 pb-6">
          <div className={cn("py-2", className)}>{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
