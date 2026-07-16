"use client";

import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
} as const;

const indicatorSize = {
  sm: "w-2.5 h-2.5 border",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
} as const;

type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: keyof typeof sizeMap;
  online?: boolean;
  className?: string;
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = "md", online, className }: AvatarProps) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className={cn("rounded-full object-cover bg-secondary/20", sizeMap[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold",
            "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light",
            sizeMap[size],
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-surface dark:border-dark-bg",
            online ? "bg-success" : "bg-text-secondary",
            indicatorSize[size],
          )}
        />
      )}
    </div>
  );
}
