import { cn } from "@/lib/utils";

interface TeamLogoProps {
  logoUrl?: string | null;
  shortCode: string;
  primaryColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

const TEXT_SIZE_MAP = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-base",
} as const;

export function TeamLogo({
  logoUrl,
  shortCode,
  primaryColor,
  size = "md",
  className,
}: TeamLogoProps) {
  const px = SIZE_MAP[size];

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={shortCode}
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
      {shortCode.slice(0, 2).toUpperCase()}
    </div>
  );
}
