import { CircleDot, ExternalLink } from "lucide-react";
import Link from "next/link";

// Update annually — avoids `new Date()` in Server Component (prerender error)
const CURRENT_YEAR = 2026;

const FOOTER_LINKS = [
  { href: "/games", label: "Тоглолтууд" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
  { href: "/awards", label: "Наградууд" },
  { href: "/docs", label: "Баримт бичиг" },
];

const LEAGUE_INFO = [
  { href: "/teams", label: "Багууд" },
  { href: "/games?season=2026", label: "2026 улирал" },
  { href: "/standings?type=division", label: "Группын шалгуур" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t court-divider">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 text-lg font-black tracking-tight text-foreground"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-sidebar text-warning">
                <CircleDot className="size-3.5" aria-hidden="true" />
              </span>
              Оноо
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Монголын сагсан бөмбөгийн лигийн албан ёсны статистик платформ.
              Бүх тоглолтын тоо баримт, шалгуур, тоглогчдын мэдээлэл.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Хуудсууд
            </h3>
            <nav aria-label="Багцын холбоосууд" className="flex flex-col gap-2">
              {FOOTER_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1 py-0.5"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* League info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Лигийн мэдээлэл
            </h3>
            <nav aria-label="Лигийн холбоосууд" className="flex flex-col gap-2">
              {LEAGUE_INFO.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-1 py-0.5"
                >
                  {item.label}
                  <ExternalLink
                    className="size-3 opacity-40"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
          </div>

          {/* Stats teaser */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Платформ
            </h3>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <span>Бүртгэгдсэн тоглолт: 450+</span>
              <span>Идэвхитэй тоглогч: 120+</span>
              <span>Баг: 16</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {CURRENT_YEAR} Оноо. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <p className="text-xs text-muted-foreground">
            Монголын Сагсан Бөмбөгийн Холбоо
          </p>
        </div>
      </div>
    </footer>
  );
}
