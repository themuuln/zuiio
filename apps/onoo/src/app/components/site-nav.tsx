import { CircleDot } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Нүүр хуудас" },
  { href: "/games", label: "Тоглолтууд" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8"
        aria-label="Үндсэн цэс"
      >
        <Link
          href="/"
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg text-lg font-black tracking-tight text-foreground transition-colors hover:text-warning-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar text-warning shadow-sm">
            <CircleDot className="size-4" aria-hidden="true" />
          </span>
          Оноо
        </Link>
        <ul className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className="inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
