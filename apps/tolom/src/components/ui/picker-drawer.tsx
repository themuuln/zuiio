"use client";

import type React from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";

interface PickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Drawer width size (default: "2xl") */
  size?: "lg" | "xl" | "2xl" | "3xl" | "4xl";
  children: React.ReactNode;
}

/**
 * Thin wrapper for picker-style drawers.
 * Encapsulates: DetailDrawer + Header + Title + Description + Body(p-0).
 *
 * Usage:
 * ```tsx
 * <PickerDrawer open={open} onOpenChange={setOpen} title="Add Service">
 *   <CatalogCombobox ... />
 * </PickerDrawer>
 * ```
 */
export function PickerDrawer({
  open,
  onOpenChange,
  title,
  description,
  size = "2xl",
  children,
}: PickerDrawerProps) {
  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      hideBackdrop
      size={size}
    >
      <DetailDrawer.Header closeButton>
        <DetailDrawer.Title>{title}</DetailDrawer.Title>
        {description && (
          <DetailDrawer.Description>
            {description}
          </DetailDrawer.Description>
        )}
      </DetailDrawer.Header>
      <DetailDrawer.Body className="p-0">
        {children}
      </DetailDrawer.Body>
    </DetailDrawer>
  );
}
