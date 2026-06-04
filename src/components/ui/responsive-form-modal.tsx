"use client";

import * as React from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { DetailSheet } from "./detail-sheet";

export type ResponsiveFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Whether to use a centered Dialog on desktop instead of a side Sheet */
  useDialogOnDesktop?: boolean;
  /** Width size for the side Sheet on desktop (default: "xl") */
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

  // Inject onSuccess/onCancel into child so it auto-closes on form submission
  const childrenWithClose = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onSuccess: (...args: unknown[]) => {
          (child.props as any)?.onSuccess?.(...args);
          onOpenChange(false);
        },
        onCancel: () => {
          (child.props as any)?.onCancel?.();
          onOpenChange(false);
        },
      });
    }
    return child;
  });

  // Mobile view: bottom Drawer
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
            <div className={cn("py-2", className)}>{childrenWithClose}</div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered Dialog
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
            <div className="py-2">{childrenWithClose}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Right Side Sheet (standard) — now uses DetailSheet
  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      size={sheetSize as any}
    >
      <DetailSheet.Header className="p-6 pb-2">
        <DetailSheet.Title className="text-xl font-bold">
          {title}
        </DetailSheet.Title>
        {description && (
          <DetailSheet.Description className="text-sm">
            {description}
          </DetailSheet.Description>
        )}
      </DetailSheet.Header>
      <DetailSheet.Body className="px-6">
        <div className={cn("py-2", className)}>{childrenWithClose}</div>
      </DetailSheet.Body>
    </DetailSheet>
  );
}
