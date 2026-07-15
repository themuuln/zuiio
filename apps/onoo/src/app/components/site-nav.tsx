"use client";

import {
  CalendarDays,
  CircleDot,
  House,
  Medal,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Нүүр", icon: House },
  { href: "/games", label: "Тоглолт", icon: CalendarDays },
  { href: "/players", label: "Тоглогч", icon: Users },
  { href: "/standings", label: "Шалгуур", icon: Trophy },
  { href: "/leaders", label: "Шилдгүүд", icon: Medal },
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();

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
        <ul className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={
                  isActivePath(pathname, item.href) ? "page" : undefined
                }
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-[background-color,color,transform] hover:bg-accent hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none",
                  isActivePath(pathname, item.href) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link
              href="/players"
              aria-label="Тоглогч хайх"
              className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] hover:bg-accent hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <Search className="size-4" aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </nav>
      <nav
        aria-label="Гар утасны үндсэн цэс"
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-medium text-muted-foreground transition-[background-color,color,transform] hover:bg-accent hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                    isActive && "text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
