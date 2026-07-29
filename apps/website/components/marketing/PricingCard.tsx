import Link from "next/link";
import { cn } from "@/lib/utils";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1L12 2z" />
    </svg>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  className?: string;
  badge?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  ctaLabel,
  className,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-visible rounded-2xl p-8 transition-shadow duration-250 ease-out",
        highlighted
          ? "border-2 border-primary bg-card shadow-brand hover:shadow-lg"
          : "border border-border bg-card hover:shadow-card-hover",
        className,
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {badge}
        </div>
      )}
      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
          <StarIcon /> Most popular
        </div>
      )}
      <h3
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        {price !== "Free" && (
          <span className="text-sm text-muted-foreground">/month</span>
        )}
      </div>
      {features.length > 0 && (
        <ul className="mt-8 flex-1 space-y-3.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <CheckIcon className="mt-0.5 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/pricing"
        className={cn(
          "mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors duration-150 ease-out",
          highlighted
            ? "btn-primary justify-center"
            : "border border-border bg-background text-foreground hover:bg-muted hover:border-foreground inline-flex items-center justify-center gap-2",
        )}
      >
        {ctaLabel}
        {!highlighted && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        )}
      </Link>
    </div>
  );
}
