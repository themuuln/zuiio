"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

function AspectRatio({
  className,
  ratio = 1,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  ratio?: number;
}) {
  return (
    <div
      data-slot="aspect-ratio"
      className={cn("relative w-full", className)}
      style={{
        aspectRatio: ratio,
        ...style,
      }}
      {...props}
    />
  );
}

export { AspectRatio };
