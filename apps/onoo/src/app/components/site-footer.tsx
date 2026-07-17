import { CircleDot } from "lucide-react";
import Link from "next/link";

// Update annually — avoids `new Date()` in Server Component (prerender error)
const CURRENT_YEAR = 2026;

const FOOTER_LINKS = [
  { href: "/games", label: "Тоглолтууд" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t court-divider">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:px-6 lg:px-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex size-6 items-center justify-center rounded-md bg-sidebar text-warning">
            <CircleDot className="size-3" aria-hidden="true" />
          </span>
          <span className="font-semibold text-foreground">Оноо</span>
          <span aria-hidden="true">·</span>
          <span>© {CURRENT_YEAR}</span>
        </div>
        <nav aria-label="Давхар цэс" className="flex gap-5">
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
    </footer>
  );
}
