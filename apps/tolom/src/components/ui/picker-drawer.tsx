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
/** Static map — Tailwind v4 scanner needs full class strings at build time. */
const SIZE_WIDTH: Record<string, string> = {
  lg: "sm:max-w-[32rem]",
  xl: "sm:max-w-[36rem]",
  "2xl": "sm:max-w-[42rem]",
  "3xl": "sm:max-w-[48rem]",
  "4xl": "sm:max-w-[56rem]",
};

export function PickerDrawer({
  open,
  onOpenChange,
  title,
  description,
  size = "2xl",
  children,
}: PickerDrawerProps) {
  const widthClass = SIZE_WIDTH[size];
  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      hideBackdrop
      modal={false}
      className={widthClass}
    >
      <DetailDrawer.Header closeButton>
        <DetailDrawer.Title>{title}</DetailDrawer.Title>
        {description && (
          <DetailDrawer.Description>{description}</DetailDrawer.Description>
        )}
      </DetailDrawer.Header>
      <DetailDrawer.Body className="p-0">{children}</DetailDrawer.Body>
    </DetailDrawer>
  );
}
