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
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
        aria-label="Үндсэн цэс"
      >
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Оноо
        </Link>
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
