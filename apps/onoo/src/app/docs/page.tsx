import { ArrowRight, Eye, Layout, ListChecks, Route } from "lucide-react";
import { cacheLife } from "next";
import Link from "next/link";

const DOCS_CARDS = [
  {
    href: "/docs/vision",
    title: "Бүтээгдэхүүний алсын хараа",
    description:
      "Оноо яагаад оршин байдаг, хэнд зориулагдсан, ямар зарчим баримталдаг, ямар үр дүнг хэмждэг.",
    icon: Eye,
  },
  {
    href: "/docs/architecture",
    title: "Архитектур",
    description:
      "Системийн бүтэц, өгөгдлийн урсгал, аюулгүй байдлын загвар, олон байгууллагын тусгаарлалт.",
    icon: Route,
  },
  {
    href: "/docs/design",
    title: "Брэнд ба дизайн систем",
    description:
      "Өнгөний систем, typography, компонентууд, motion, болон player showcase.",
    icon: Layout,
  },
  {
    href: "/docs/features",
    title: "Фичерийн бүртгэл",
    description:
      "Хийсэн, ажиллаж буй, төлөвлөсөн, backlog-т байгаа бүх боломжууд.",
    icon: ListChecks,
  },
  {
    href: "/docs/roadmap",
    title: "Замын зураг",
    description:
      "Арилжааны босго болон амжилтын хэмжүүртэй үе шаттай гүйцэтгэлийн төлөвлөгөө.",
    icon: ArrowRight,
  },
];

export default async function DocsIndexPage() {
  "use cache";
  cacheLife("reference");
  return (
    <div>
      <div className="mb-10">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-foreground">
          Баримт бичиг
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Оноо-ийн бүтээгдэхүүн, дизайн систем, архитектур, фичерүүд, замын
          зурагтай холбоотой бүх чухал мэдээлэл.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOCS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-all hover:border-[var(--brand-sports)]/30 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="mb-1 font-semibold text-foreground transition-colors group-hover:text-[var(--brand-sports)]">
                  {card.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
