import type { IconType } from "react-icons";
import {
  SiAcura,
  SiAudi,
  SiBmw,
  SiChevrolet,
  SiFord,
  SiHonda,
  SiHyundai,
  SiKia,
  SiLandrover,
  SiMazda,
  SiMitsubishi,
  SiNissan,
  SiPorsche,
  SiSubaru,
  SiSuzuki,
  SiToyota,
  SiVolkswagen,
} from "react-icons/si";
import { TbBrandMercedes } from "react-icons/tb";
import { cn } from "@/lib/utils";

/**
 * Maps vehicle make names to their brand icons.
 * 18 brands from react-icons, 2 SVG fallbacks (Lexus, Genesis).
 */
const LOGO_MAP: Record<string, IconType> = {
  acura: SiAcura,
  audi: SiAudi,
  bmw: SiBmw,
  chevrolet: SiChevrolet,
  ford: SiFord,
  honda: SiHonda,
  hyundai: SiHyundai,
  kia: SiKia,
  "land rover": SiLandrover,
  mazda: SiMazda,
  mitsubishi: SiMitsubishi,
  nissan: SiNissan,
  porsche: SiPorsche,
  subaru: SiSubaru,
  suzuki: SiSuzuki,
  toyota: SiToyota,
  volkswagen: SiVolkswagen,
  vw: SiVolkswagen,
  "mercedes-benz": TbBrandMercedes,
  mercedes: TbBrandMercedes,
};

/* ── SVG fallbacks for brands not in react-icons ──────────────── */

function LexusLogo({ className, ...p }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...p}
    >
      <ellipse cx="12" cy="12" rx="10" ry="8" />
      <path d="M9 7v10.5h6.5" />
    </svg>
  );
}

function GenesisLogo({ className, ...p }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...p}
    >
      <path d="M12 14l-8-4c2-3 5-5 8-6 3 1 6 3 8 6l-8 4z" />
      <path d="M12 14l-5-2.5c1.5-2 3-3 5-3.5 2 .5 3.5 1.5 5 3.5l-5 2.5z" />
    </svg>
  );
}

const SVG_FALLBACKS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  lexus: LexusLogo,
  genesis: GenesisLogo,
};

/* ── Letter fallback for unknown makes ────────────────────────── */

function DefaultLogo({
  make,
  className,
  ...p
}: React.SVGProps<SVGSVGElement> & { make: string }) {
  const letter = make?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...p}>
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, sans-serif"
      >
        {letter}
      </text>
    </svg>
  );
}

/* ── Public component ─────────────────────────────────────────── */

interface VehicleMakeLogoProps {
  make: string | null | undefined;
  className?: string;
  /** Forwarded to react-icons `size` — overrides inline SVG width/height. */
  size?: number | string;
}

export function VehicleMakeLogo({
  make,
  className,
  size,
}: VehicleMakeLogoProps) {
  const key = make?.toLowerCase().trim() ?? "";
  const sizes = size ? undefined : cn("size-5", className);

  // 1. react-icons brand icons
  const Icon = LOGO_MAP[key];
  if (Icon) return <Icon className={sizes ?? className} size={size} />;

  // 2. SVG fallbacks (Lexus, Genesis)
  const Fallback = SVG_FALLBACKS[key];
  if (Fallback)
    return (
      <Fallback
        className={sizes ?? className}
        style={size ? { width: size, height: size } : undefined}
      />
    );

  // 3. Letter fallback
  return (
    <DefaultLogo
      make={key}
      className={sizes ?? className}
      style={size ? { width: size, height: size } : undefined}
    />
  );
}
