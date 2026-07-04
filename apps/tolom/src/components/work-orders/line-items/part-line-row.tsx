"use client";

import { Typography } from "@/components/ui/typography";
import { formatCurrency } from "@/lib/utils";

/**
 * A simplified part line row displaying only part name and price.
 *
 * Shows part name on the left and final price on the right in one row.
 */
export interface PartLineRowProps {
  /** Part name */
  name: string;
  /** Mongolian name (optional — shown when locale is "mn") */
  nameMn?: string | null;
  /** Final price */
  finalPrice: number;
  /** Locale for name display */
  locale?: string;
}

export function PartLineRow({
  name,
  nameMn,
  finalPrice,
  locale = "en",
}: PartLineRowProps) {
  const displayName = locale === "mn" && nameMn ? nameMn : name;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg">
      <Typography.Text className="text-sm font-medium truncate">
        {displayName}
      </Typography.Text>
      <span className="text-sm font-semibold tabular-nums shrink-0">
        {formatCurrency(finalPrice)}
      </span>
    </div>
  );
}
