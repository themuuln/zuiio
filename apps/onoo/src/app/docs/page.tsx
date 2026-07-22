import Link from "next/link";
import { ArrowRight, BookOpen, Eye, Route, Layout, ListChecks } from "lucide-react";

const DOCS_CARDS = [
  {
    href: "/docs/vision",
    title: "Product Vision",
    description:
      "Why Onoo exists, who it's for, design principles, and success measures.",
    icon: Eye,
  },
  {
    href: "/docs/architecture",
    title: "Architecture",
    description:
      "System architecture, data flow, security model, and tenant isolation.",
    icon: Route,
  },
  {
    href: "/docs/design",
    title: "Brandbook & Design System",
    description:
      "Color system, typography, components, motion, and the player showcase.",
    icon: Layout,
  },
  {
    href: "/docs/features",
    title: "Feature Inventory",
    description:
      "Everything shipped, in progress, planned, and in the backlog.",
    icon: ListChecks,
  },
  {
    href: "/docs/roadmap",
    title: "Roadmap",
    description:
      "Phased execution plan with commercial gates and success measures.",
    icon: ArrowRight,
  },
];

export default function DocsIndexPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-foreground">
          Documentation
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Everything you need to know about Onoo — the product, design system,
          architecture, features, and roadmap.
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
                <h2 className="mb-1 font-semibold text-foreground group-hover:text-[var(--brand-sports)] transition-colors">
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
