import { ArrowRight, Rocket } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-2xl border bg-background px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 opacity-10">
            <Rocket className="size-64 text-primary" />
          </div>

          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Бизнесээ дижитал болгоход бэлэн үү?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
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
      </div>
    </section>
  );
}
