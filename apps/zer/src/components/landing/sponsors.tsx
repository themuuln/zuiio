import { Marquee } from "@/components/ui/marquee";

const sponsors = [
  { name: "Тэнгэр Сувг", slug: "tenger-suvg" },
  { name: "Номин Худалдаа", slug: "nomin" },
  { name: "Гоёо", slug: "gooyo" },
  { name: "Фитнес Зүрх", slug: "fitness-zurkh" },
  { name: "Монгол Шилдэг", slug: "mongol-shildeg" },
  { name: "Эко Фудс", slug: "eco-foods" },
  { name: "Сод Монгол", slug: "sod-mongol" },
  { name: "Алтан Говь", slug: "altangovi" },
];

function SponsorLogo({ name }: { name: string }) {
  return (
    <div className="mx-4 flex size-24 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/50 px-4 shadow-sm backdrop-blur-sm md:mx-6 md:size-28">
      <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {name}
      </span>
    </div>
  );
}

function SponsorLogosRow({ reverse = false }: { reverse?: boolean }) {
  return (
    <Marquee reverse={reverse} pauseOnHover repeat={5}>
      {sponsors.map((sponsor) => (
        <SponsorLogo key={sponsor.slug} name={sponsor.name} />
      ))}
    </Marquee>
  );
}

export function Sponsors() {
  return (
    <section
      id="sponsors"
      className="relative overflow-hidden border-t bg-muted/30 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-1/3 top-0 h-64 w-64 rounded-full bg-primary/[0.02] blur-[100px]" />
        <div className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full bg-teal-500/[0.02] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Түншүүд
          </p>
          <h2 className="mb-4 font-display text-4xl leading-tight md:text-5xl">
            Бидэнтэй хамт
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Манай итгэмжлэгдсэн түнш, хамтрагч байгууллагууд.
          </p>
        </div>

        <div className="relative">
          {/* Gradient fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-muted/30 via-muted/10 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-muted/30 via-muted/10 to-transparent" />

          <SponsorLogosRow />
          <div className="mt-6">
            <SponsorLogosRow reverse />
          </div>
        </div>
      </div>
    </section>
  );
}
