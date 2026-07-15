interface TeamLogoProps {
  logoUrl?: string | null;
  shortCode: string;
  primaryColor?: string | null;
  size?: "sm" | "md" | "lg";
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
}: TeamLogoProps) {
  const px = SIZE_MAP[size];

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={shortCode}
        width={px}
        height={px}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${TEXT_SIZE_MAP[size]}`}
      style={{
        width: px,
        height: px,
        backgroundColor: primaryColor || "#1e293b",
      }}
      aria-hidden="true"
    >
      {shortCode.slice(0, 2).toUpperCase()}
    </div>
  );
}
