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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DetailSheet } from "./detail-sheet";

export type ResponsiveFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
  /** Whether to use a centered Dialog on desktop instead of a side Sheet */
  useDialogOnDesktop?: boolean;
  /** Width size for the side Sheet on desktop (default: "xl") */
  sheetSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  /** opt footer content (rendered in all paths: Drawer, Dialog, and DetailSheet) */
  footer?: React.ReactNode;
};

export function ResponsiveFormModal({
  open,
  onOpenChange,
  title,
  desc,
  children,
  className,
  useDialogOnDesktop = false,
  sheetSize = "xl",
  footer,
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="max-h-[92vh] flex flex-col"
          showCloseButton={false}
        >
          <SheetHeader className="text-left shrink-0">
            <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
            {desc && (
              <SheetDescription className="text-xs">{desc}</SheetDescription>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-4 pb-6">
            <div className={cn("py-2", className)}>{childrenWithClose}</div>
          </ScrollArea>
          {footer && (
            <div className="shrink-0 border-t px-4 py-3">{footer}</div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Centered Dialog
  if (useDialogOnDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden",
          )}
        >
          <DialogHeader className="p-6 pb-2 shrink-0 text-left">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            {desc && (
              <DialogDescription className="text-sm">{desc}</DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="py-2">{childrenWithClose}</div>
          </ScrollArea>
          {footer && (
            <div className="shrink-0 border-t px-6 py-3">{footer}</div>
          )}
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
        {desc && (
          <DetailSheet.Description className="text-sm">
            {desc}
          </DetailSheet.Description>
        )}
      </DetailSheet.Header>
      <DetailSheet.Body className="px-6">
        <div className={cn("py-2", className)}>{childrenWithClose}</div>
      </DetailSheet.Body>
      {footer && <DetailSheet.Footer>{footer}</DetailSheet.Footer>}
    </DetailSheet>
  );
}
