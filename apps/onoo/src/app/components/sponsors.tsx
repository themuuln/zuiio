import { cn } from "@/lib/utils";

const sponsors = [
  { name: "Бодонс Академи", slug: "bodons" },
  { name: "Монгол Спорт", slug: "mongol-sport" },
  { name: "Монголбаскет", slug: "mongolbasket" },
  { name: "Шилдэг Лиг", slug: "shildeg-lig" },
  { name: "Хүч Спорт", slug: "huch-sport" },
  { name: "Спорт Плюс", slug: "sport-plus" },
  { name: "Алтан Сагс", slug: "altan-sags" },
  { name: "Сэлэнгэ Спорт", slug: "selenge-sport" },
];

function SponsorLogo({ name }: { name: string }) {
  return (
    <div className="mx-4 flex size-24 shrink-0 items-center justify-center rounded-xl border border-sidebar-border/50 bg-sidebar-accent/30 px-4 shadow-sm backdrop-blur-sm md:mx-6 md:size-28">
      <span className="text-center text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
        {name}
      </span>
    </div>
  );
}

function MarqueeRow({
  children,
  reverse = false,
}: {
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around gap-(--gap) animate-marquee",
            reverse && "[animation-direction:reverse]",
            "group-hover:[animation-play-state:paused]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

export function Sponsors() {
  return (
    <section
      id="sponsors"
      className="overflow-hidden border-t border-sidebar-border/30 bg-[var(--surface-1)] py-16 sm:py-20"
    >
      <div className="mb-12 text-center px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-warning">
          Түншүүд
        </p>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-sidebar-foreground sm:text-4xl">
          Бидэнтэй хамт
        </h2>
      </div>

      <div className="relative">
        {/* Gradient fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--surface-1)] via-[var(--surface-1)]/50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--surface-1)] via-[var(--surface-1)]/50 to-transparent" />

        <MarqueeRow>
          {sponsors.map((sponsor) => (
            <SponsorLogo key={sponsor.slug} name={sponsor.name} />
          ))}
        </MarqueeRow>

        <div className="mt-4">
          <MarqueeRow reverse>
            {sponsors.map((sponsor) => (
              <SponsorLogo key={sponsor.slug} name={sponsor.name} />
            ))}
          </MarqueeRow>
        </div>
      </div>
    </section>
  );
}
