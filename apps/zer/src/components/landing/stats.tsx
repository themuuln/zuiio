import {
  BuildingOffice,
  ClipboardText,
  Cube,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";

const stats = [
  {
    value: "500+",
    label: "Байгууллага ашиглаж байна",
    icon: BuildingOffice,
  },
  {
    value: "50,000+",
    label: "Борлуулалт бүртгэгдсэн",
    icon: ClipboardText,
  },
  {
    value: "100,000+",
    label: "Бараа материалын нэгж",
    icon: Cube,
  },
  {
    value: "99.9%",
    label: "Системийн тогтвортой байдал",
    icon: TrendUp,
  },
];

export function Stats() {
  return (
    <section
      id="stats"
      className="relative overflow-hidden border-t bg-muted/30 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-0 h-64 w-64 rounded-full bg-primary/[0.02] blur-[100px]" />
        <div className="absolute left-1/4 bottom-0 h-64 w-64 rounded-full bg-teal-500/[0.02] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Үзүүлэлтүүд
          </p>
          <h2 className="mb-4 font-display text-4xl leading-tight md:text-5xl">
            Баталгаатай үр дүн
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Zer нь Монголын жижиг дунд бизнесийг дэмжиж, жил бүр өсөн хөгжиж
            байна.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.value}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-primary/30 to-teal-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-6" />
                </div>

                <div className="mb-2 font-display text-4xl font-bold md:text-5xl">
                  <span className="bg-gradient-to-r from-violet-600 via-primary to-teal-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-primary dark:to-teal-400">
                    {stat.value}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
