import Link from "next/link";
import { cn } from "@/lib/utils";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ZerIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect
        x="8"
        y="6"
        width="32"
        height="36"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="14"
        y1="16"
        x2="34"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="22"
        x2="28"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="28"
        x2="26"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="33" cy="28" r="6" fill="currentColor" opacity="0.15" />
      <text
        x="33"
        y="31"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="currentColor"
      >
        ₮
      </text>
    </svg>
  );
}

function TolomIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M24 8v8M24 32v8M8 24h8M32 24h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.15" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TumurchIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <circle cx="24" cy="14" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14 42v-6a10 10 0 0 1 20 0v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="20"
        x2="14"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="20"
        x2="34"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="14" r="3" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function TamgaIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <path
        d="M12 36c0-8 4-14 12-20 8 6 12 12 12 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="24"
        y1="16"
        x2="24"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="36"
        x2="24"
        y2="42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="26" r="5" fill="currentColor" opacity="0.15" />
      <circle cx="24" cy="26" r="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ZuiioIdIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect
        x="10"
        y="6"
        width="28"
        height="36"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 34a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="10"
        y="6"
        width="28"
        height="36"
        rx="4"
        fill="currentColor"
        opacity="0.08"
      />
    </svg>
  );
}

const variantConfig = {
  zer: {
    icon: ZerIcon,
    color: "var(--color-primary)",
    bg: "var(--brand-violet-glow)",
  },
  tolom: {
    icon: TolomIcon,
    color: "var(--product-tolom)",
    bg: "var(--product-tolom-glow)",
  },
  tumurch: {
    icon: TumurchIcon,
    color: "var(--product-tumurch)",
    bg: "var(--product-tumurch-glow)",
  },
  tamga: {
    icon: TamgaIcon,
    color: "var(--product-tamga)",
    bg: "var(--product-tamga-glow)",
  },
  "zuiio-id": {
    icon: ZuiioIdIcon,
    color: "var(--product-zuiio)",
    bg: "var(--product-zuiio-glow)",
  },
} as const;

interface ProductCardProps {
  name: string;
  tagline: string;
  description: string;
  href: string;
  accent?: string;
  className?: string;
  variant: keyof typeof variantConfig;
}

export function ProductCard({
  name,
  tagline,
  description,
  href,
  className,
  variant,
}: ProductCardProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card p-8 shadow-md transition-shadow duration-250 ease-out hover:shadow-lg",
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      {/* Abstract app UI panel */}
      <div
        className="mb-5 overflow-hidden rounded-lg border"
        style={{
          borderColor: `color-mix(in oklch, ${config.color} 20%, transparent)`,
          backgroundColor: `color-mix(in oklch, ${config.color} 4%, var(--color-background))`,
        }}
        aria-hidden="true"
      >
        <div
          className="flex items-center gap-1.5 border-b px-3 py-1.5"
          style={{
            borderColor: `color-mix(in oklch, ${config.color} 12%, transparent)`,
            backgroundColor: `color-mix(in oklch, ${config.color} 6%, transparent)`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: config.color, opacity: 0.5 }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: config.color, opacity: 0.3 }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: config.color, opacity: 0.2 }}
          />
        </div>
        <div className="flex" style={{ height: "4.5rem" }}>
          <div
            className="sm:block w-10 border-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              borderColor: `color-mix(in oklch, ${config.color} 10%, transparent)`,
              backgroundColor: `color-mix(in oklch, ${config.color} 3%, transparent)`,
            }}
          />
          <div className="flex-1 p-2.5 transition-transform duration-300 group-hover:-translate-y-0.5">
            <div
              className="mb-1.5 h-1.5 w-16 rounded-full"
              style={{ backgroundColor: config.color, opacity: 0.15 }}
            />
            <div
              className="mb-1 h-1 w-full max-w-[70%] rounded-full"
              style={{ backgroundColor: config.color, opacity: 0.08 }}
            />
            <div
              className="mb-1 h-1 w-full max-w-[55%] rounded-full"
              style={{ backgroundColor: config.color, opacity: 0.06 }}
            />
            <div className="flex gap-1.5 mt-2">
              <div
                className="h-4 w-12 rounded"
                style={{ backgroundColor: config.color, opacity: 0.12 }}
              />
              <div
                className="h-4 w-12 rounded"
                style={{ backgroundColor: config.color, opacity: 0.08 }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          <Icon />
        </div>
        <span
          className="rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {tagline}
        </span>
      </div>
      <h3
        className="text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {name}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div
        className="mt-6 flex items-center gap-1.5 text-sm font-medium transition-all duration-250 ease-out group-hover:gap-3"
        style={{ color: config.color }}
      >
        Learn more…{" "}
        <ArrowRightIcon className="transition-transform duration-250 ease-out group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
