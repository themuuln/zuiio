import {
  ArrowRight,
  Cube,
  ShoppingCart,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: Cube,
    label: "Бараа материалын бүртгэл",
    desc: "Бүтээгдэхүүний нөөц, үнэ, түүхийг нэг дэлгэцээс хянах.",
  },
  {
    icon: ShoppingCart,
    label: "Борлуулалт & тооцоо",
    desc: "POS-ээр хурдан борлуулалт хийж, нэхэмжлэл үүсгэн, төлбөр хүлээн авах.",
  },
  {
    icon: Users,
    label: "Санхүү & Нягтлан",
    desc: "Ерөнхий журнал, тэнцлэг, зарлагын ангилал — бүх санхүүгийн мэдээлэл нэг дор.",
  },
];

function GridPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 size-full opacity-[0.03] dark:opacity-[0.06]"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="hero-grid"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 64 0 L 0 0 0 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-grid)" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Grid pattern background */}
      <GridPattern />

      {/* Gradient orbs — violet left, teal right */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px] dark:bg-violet-500/15" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-[100px] dark:bg-teal-400/15" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Pre-heading badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Жижиг дунд бизнест зориулсан ERP систем
          </div>

          <h1 className="mb-6 font-display text-5xl leading-tight tracking-tight md:text-7xl lg:text-[4.5rem] lg:leading-[1.1]">
            Бизнесээ хялбархан
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-primary to-teal-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-primary dark:to-teal-400">
              удирдаарай
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Бараа материалын бүртгэл, борлуулалт, зарлага, харилцагчийн
            менежмент — бүгд нэг системд. Монгол жижиг дунд бизнест зориулсан
            энгийн, хэрэгцээт ERP.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto shadow-lg shadow-primary/25"
            >
              <Link href="/login">
                Үнэгүй эхлэх
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto border-primary/20"
            >
              <a href="#features">Дэлгэрэнгүй</a>
            </Button>
          </div>

          {/* App preview / dashboard mockup */}
          <div className="mt-20">
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/50 shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-amber-400" />
                  <div className="size-3 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto flex max-w-md flex-1 items-center justify-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                  <span className="size-3 rounded-full bg-primary/30" />
                  mybusiness.zer.mn
                </div>
              </div>

              {/* Dashboard preview content */}
              <div className="p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  {/* Main preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-muted-foreground/10" />
                      <div className="h-8 w-24 rounded-lg bg-primary/20" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["₮12.4M", "₮8.2M", "₮4.1M"].map((val, i) => (
                        <div
                          key={val}
                          className="rounded-xl border border-border/40 bg-background/80 p-4 text-left backdrop-blur-sm"
                        >
                          <div className="mb-1 text-xs text-muted-foreground">
                            {
                              [
                                "Өдрийн борлуулалт",
                                "Сарын борлуулалт",
                                "Нийт ашиг",
                              ][i]
                            }
                          </div>
                          <div className="text-lg font-bold tabular-nums tracking-tight">
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-border/40 bg-background/80 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="h-4 w-24 rounded bg-muted-foreground/10" />
                        <div className="h-6 w-16 rounded-md bg-muted" />
                      </div>
                      <div className="space-y-2">
                        {[85, 60, 45, 30].map((w) => (
                          <div key={w} className="flex items-center gap-3">
                            <div className="h-3 w-16 rounded bg-muted-foreground/10" />
                            <div className="h-3 flex-1 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-teal-400"
                                style={{ width: `${w}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Side panel */}
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border/40 bg-background/80 p-4 backdrop-blur-sm">
                      <div className="mb-3 h-4 w-20 rounded bg-muted-foreground/10" />
                      <div className="space-y-3">
                        {(["Бямба", "Баасан", "Пүрэв", "Лхагва"] as const).map(
                          (day, idx) => {
                            const widths = [85, 62, 48, 35];
                            const vals = [280, 220, 160, 120];
                            return (
                              <div
                                key={day}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-muted-foreground">
                                  {day}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-primary/60"
                                      style={{
                                        width: `${widths[idx]}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="w-14 text-right tabular-nums text-xs text-muted-foreground">
                                    {vals[idx]}K
                                  </span>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-background/80 p-4 backdrop-blur-sm">
                      <div className="mb-3 h-4 w-24 rounded bg-muted-foreground/10" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Бэлэн</span>
                          <span className="font-medium tabular-nums">
                            ₮2.4M
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Карт</span>
                          <span className="font-medium tabular-nums">
                            ₮8.1M
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Шилжүүлэг</span>
                          <span className="font-medium tabular-nums">
                            ₮1.9M
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-20 grid gap-x-12 gap-y-8 border-t pt-12 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="group text-left">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
