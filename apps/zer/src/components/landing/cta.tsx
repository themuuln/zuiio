import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t py-20 md:py-28">
      {/* Warm atmospheric wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] to-transparent" />

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Бизнесээ дижитал болгоход бэлэн үү?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Өнөөдөр бүртгүүлж, Zer-ийн бүх боломжийг 14 хоног үнэгүй туршаад
            үзээрэй. Кредит карт шаардахгүй.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/login">
                Үнэгүй туршиж эхлэх
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Онцлогуудыг үзэх</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
