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
    <svg viewBox="0 0 612 612" fill="currentColor" className={className} {...p}>
      <path d="M306,522.4c101.3,0,191.2-35.4,246.9-89.9l-50.2,0.2c-47.4,39.9-116.8,65-195.4,65c-146.7,0-261.1-87.4-261.1-195.2c0-124.4,114.5-195.2,261.1-195.2c9.3,0,16.8,4.3,11.2,12.4C288,156.4,201.2,274.5,185.4,300.1c-31.2,50.4-30.5,112.5,46,116.9H553c16.4,0,20.6-7.7,26.5-15.7c21.5-29.1,32.5-63.2,32.4-98.7c-0.1-92.7-65.3-162.1-161.2-196.3l-14.8,22.2c79.7,29.4,132.4,88.9,132.4,174.1c0,14.8-2.2,29.2-6.3,43.1c-3.6,12-10.5,22.2-23.7,22.2H281.7c-32.9,0-20.2-33.9-8-50.4c17.7-31.7,114.4-163.5,137.7-188.1c5.9-9,22.6-27.7-0.4-34.8c-32.7-7.8-68.1-11.8-105-11.8C137,82.7,0.1,169.5,0,302.5C-0.1,436.8,137,522.4,306,522.4L306,522.4z" />
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
  "land rover": LexusLogo,
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
