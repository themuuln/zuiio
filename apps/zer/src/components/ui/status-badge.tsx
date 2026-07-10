"use client";

import type { VariantProps } from "class-variance-authority";
import { Badge, type badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface StatusMapping {
  label: string;
  variant: BadgeVariant;
}

interface StatusBadgeProps {
  /** The raw status value (e.g. "pending", "paid") */
  value: string;
  /** Mapping from status values to {label, variant} */
  mapping: Record<string, StatusMapping>;
}

/**
 * Standardized status badge for detail drawers and tables.
 *
 * Usage:
 * ```tsx
 * const STATUS_MAP = {
 *   pending: { label: "Хүлээгдэж буй", variant: "secondary" },
 *   paid: { label: "Төлөгдсөн", variant: "default" },
 * };
 *
 * <StatusBadge value={invoice.status} mapping={STATUS_MAP} />
 * ```
 */
export function StatusBadge({ value, mapping }: StatusBadgeProps) {
  const entry = mapping[value];
  if (!entry) {
    return <Badge variant="outline">{value}</Badge>;
  }
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
