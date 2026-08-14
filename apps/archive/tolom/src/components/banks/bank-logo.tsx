"use client";

import Image from "next/image";
import { useState } from "react";
import type { MongolianBank } from "@/lib/payments/mongolian-banks";
import { cn } from "@/lib/utils";

interface BankLogoProps {
  bank: Pick<MongolianBank, "logo" | "nameEn" | "brandColor">;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_MAP = {
  sm: 20,
  md: 28,
} as const;

export function BankLogo({ bank, size = "sm", className }: BankLogoProps) {
  const [failed, setFailed] = useState(false);
  const dimension = SIZE_MAP[size];

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white",
          className,
        )}
        style={{
          width: dimension,
          height: dimension,
          backgroundColor: bank.brandColor,
        }}
        aria-hidden
      >
        {bank.nameEn.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={bank.logo}
      alt=""
      width={dimension}
      height={dimension}
      className={cn("shrink-0 rounded-md object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
