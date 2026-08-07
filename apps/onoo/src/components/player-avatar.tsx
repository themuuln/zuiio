import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  photoUrl?: string | null;
  name: string;
  primaryColor?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
  "2xl": 128,
} as const;

const TEXT_SIZE_MAP = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-2xl",
  "2xl": "text-4xl",
} as const;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function PlayerAvatar({
  photoUrl,
  name,
  primaryColor,
  size = "md",
  className,
}: PlayerAvatarProps) {
  const px = SIZE_MAP[size];

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={px}
        height={px}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-sidebar-foreground",
        TEXT_SIZE_MAP[size],
        className,
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: primaryColor || "var(--color-sidebar)",
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
