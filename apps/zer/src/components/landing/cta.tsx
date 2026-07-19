import { ArrowRight, RocketLaunch } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t py-20 md:py-28">
      {/* Brand gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/2 h-[400px] w-[600px] -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/8 to-teal-500/8 blur-[120px]" />
      </div>

      {/* Subtle border accents */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-4">
        <div className="relative mx-auto max-w-2xl text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-teal-500/10 shadow-sm ring-1 ring-primary/10">
            <RocketLaunch className="size-6 text-primary" />
          </div>

          <h2 className="mb-4 font-display text-4xl leading-tight md:text-5xl">
            Бизнесээ дижитал болгоход бэлэн үү?
          </h2>
          <p className="mb-8 text-base text-muted-foreground md:text-lg">
            Өнөөдөр бүртгүүлж, Zer-ийн бүх боломжийг үнэгүй ашиглаж эхлээрэй.
            Кредит карт шаардахгүй.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto shadow-lg shadow-primary/25"
            >
              <Link href="/login">
                Үнэгүй туршиж эхлэх
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <a href="#features">Онцлогуудыг үзэх</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
