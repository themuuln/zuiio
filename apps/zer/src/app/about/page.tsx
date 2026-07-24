import {
  ArrowRight,
  ChartBar,
  Clock,
  CurrencyCircleDollar,
  Package,
  RocketLaunch,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Бидний тухай — Zer",
  description:
    "Zer нь Монголын жижиг дунд бизнест зориулсан ERP систем. Бидний зорилго бол Монголын бизнес эрхлэгчдэд хялбар, хэрэгцээт дижитал хэрэгсэл бүтээх явдал юм.",
};

const stats = [
  {
    icon: Users,
    value: "2,000+",
    label: "Бизнессүүд",
  },
  {
    icon: Package,
    value: "50,000+",
    label: "Бүртгэлтэй бараа",
  },
  {
    icon: Clock,
    value: "99.9%",
    label: "Системийн хугацаа",
  },
  {
    icon: CurrencyCircleDollar,
    value: "₮0",
    label: "Эхлэх зардал",
  },
];

const values = [
  {
    icon: Package,
    title: "Энгийн",
    description:
      "Бид үйл ажиллагааг хүндрүүлдэггүй. Бизнесийн жинхэнэ хэрэгцээнд тулгуурлан, хэрэглэхэд амархан систем бүтээдэг.",
  },
  {
    icon: ChartBar,
    title: "Үр дүнтэй",
    description:
      "Цаг хугацаа, зардлыг хэмнэхэд чиглэдэг. Бидний зорилго бол хэрэглэгчдийн ажлыг хурдан, үр дүнтэй болгох явдал юм.",
  },
  {
    icon: Users,
    title: "Монголд зориулсан",
    description:
      "Бид Монголын зах зээлийн онцлог, хэрэгцээг ойлгодог. Zer нь Монгол бизнес эрхлэгчдийн жинхэнэ асуудлыг шийдвэрлэхээр бүтээгдсэн.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      {/* Intro */}
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
          Бидний тухай
        </p>
        <h1 className="mb-6 font-display text-4xl leading-tight md:text-5xl">
          Zer-ийн тухай
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Zer нь Монголын жижиг дунд бизнест зориулсан ERP систем юм. Бидний
          зорилго бол Монголын бизнес эрхлэгчдэд хялбар, хэрэгцээт дижитал
          хэрэгсэл бүтээх явдал юм.
        </p>
      </div>

      {/* Бидний түүх */}
      <section className="mx-auto max-w-3xl px-4 mt-16">
        <div className="rounded-2xl border border-border/60 bg-card p-8 md:p-10">
          <h2 className="mb-4 font-display text-2xl">Бидний түүх</h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Монголын жижиг, дунд бизнес эрхлэгчид ихэвчлэн хэтэрхий төвөгтэй,
              үнэтэй ERP системүүдтэй тулгардаг. Томоохон компаний шийдлүүд
              жижиг бизнесийн хэрэгцээг хангаж чадахгүй, харин энгийн нягтлан
              бодох бүртгэл болон бичиг хэрэг нь бизнес өсөхөд саад болдог.
            </p>
            <p>
              Zer үүнийг өөрчлөхөөр зоригтойгоор гарч ирсэн. Бид Монгол бизнес
              эрхлэгчдэд хэрэгцээт бүх зүйлсийг нэг дор — бараа материалын
              бүртгэлээс санхүү, харилцагч, агуулах хүртэл — хялбар, ойлгомжтой
              байдлаар санал болгож байна.
            </p>
            <p>
              Бид итгэдэг — бизнес эрхлэх нь хэцүү байх албагүй. Таны цаг, мөнгө
              нь жинхэнэ бизнесийнхээ хөгжилд зарцуулагдах ёстой.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-8 text-center"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="mb-1 text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Values */}
      <div className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className="group rounded-2xl border border-border/60 bg-card p-8 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-7" />
                </div>
                <h2 className="mb-3 text-lg font-semibold">{value.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <section className="relative overflow-hidden border-t py-20 md:py-28 mt-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/2 h-[400px] w-[600px] -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/8 to-teal-500/8 blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="mx-auto max-w-6xl px-4">
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-teal-500/10 shadow-sm ring-1 ring-primary/10">
              <RocketLaunch className="size-6 text-primary" />
            </div>

            <h2 className="mb-4 font-display text-4xl leading-tight md:text-5xl">
              Бүртгүүлээд эхлэх
            </h2>
            <p className="mb-8 text-base text-muted-foreground md:text-lg">
              Өнөөдөр бүртгүүлж, Zer-ийн бүх боломжийг үнэгүй ашиглаж эхлээрэй.
              Кредит карт шаардахгүй.
            </p>
            <Button size="lg" asChild className="shadow-lg shadow-primary/25">
              <Link href="/login">
                Бүртгүүлээд эхлэх
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
