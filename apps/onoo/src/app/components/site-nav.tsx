"use client";

import { CircleDot, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Нүүр хуудас" },
  { href: "/games", label: "Тоглолтууд" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
      <div className="h-0.5 bg-[var(--brand-sports)]" aria-hidden="true" />
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-1.5 sm:px-6 lg:px-8"
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
        <ul className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "bg-[var(--brand-sports)]/10 text-[var(--ink)] font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0">
            <Link
              href="/search"
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-lg transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                pathname === "/search"
                  ? "bg-[var(--brand-sports)]/10 text-[var(--ink)]"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              aria-label="Хайх"
              aria-current={pathname === "/search" ? "page" : undefined}
            >
              <Search className="size-4" aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
