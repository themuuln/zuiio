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
import { DetailDrawer } from "./detail-drawer";

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
  /** opt footer content (rendered in all paths: Drawer, Dialog, and DetailDrawer) */
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
      return React.cloneElement(
        child as React.ReactElement<Record<string, unknown>>,
        {
          onSuccess: (...args: unknown[]) => {
            const props = child.props as Record<string, unknown>;
            (props.onSuccess as (...a: unknown[]) => void)?.(...args);
            onOpenChange(false);
          },
          onCancel: () => {
            const props = child.props as Record<string, unknown>;
            (props.onCancel as () => void)?.();
            onOpenChange(false);
          },
        },
      );
    }
    return child;
  });

  // Mobile view: bottom Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          showCloseButton={false}
          contentClassName="max-h-[92vh] flex flex-col"
        >
          <DrawerHeader className="text-left shrink-0">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            {desc && (
              <DrawerDescription className="text-xs">{desc}</DrawerDescription>
            )}
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-4 pb-6">
            <div className={cn("py-2", className)}>{childrenWithClose}</div>
          </ScrollArea>
          {footer && (
            <div className="shrink-0 border-t px-4 py-3">{footer}</div>
          )}
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

  // Desktop: Right Side Sheet (standard) — now uses DetailDrawer
  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header className="p-6 pb-2">
        <DetailDrawer.Title className="text-xl font-bold">
          {title}
        </DetailDrawer.Title>
        {desc && (
          <DetailDrawer.Description className="text-sm">
            {desc}
          </DetailDrawer.Description>
        )}
      </DetailDrawer.Header>
      <DetailDrawer.Body className="px-6">
        <div className={cn("py-2", className)}>{childrenWithClose}</div>
      </DetailDrawer.Body>
      {footer && <DetailDrawer.Footer>{footer}</DetailDrawer.Footer>}
    </DetailDrawer>
  );
}
