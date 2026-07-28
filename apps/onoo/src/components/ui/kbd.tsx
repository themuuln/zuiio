import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Kbd({
  className,
  children,
  ...props
}: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground [&>abbr]:no-underline",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
