"use client";

import { CircleDot, Search, ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

// Lazy-load the search dialog — saves ~10K + Dialog/Input/icon code from every page
const SearchCommand = dynamic(
  () => import("./search-command").then((m) => ({ default: m.SearchCommand })),
  { ssr: false },
);

const NAV_ITEMS = [
  { href: "/", label: "Нүүр хуудас" },
  { href: "/games", label: "Тоглолтууд" },
  { href: "/players", label: "Тоглогчид" },
  { href: "/standings", label: "Шалгуур" },
  { href: "/leaders", label: "Тэргүүлэгчид" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="border-b bg-background/90 backdrop-blur-xl">
      {/* Energetic amber accent bar — the sports signature */}
      <div
        className="h-[3px] bg-gradient-to-r from-transparent via-[var(--brand-sports)] to-transparent"
        aria-hidden="true"
      />
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-1.5 sm:px-6 lg:px-8"
        aria-label="Үндсэн цэс"
      >
        {/* Logo */}
        <Link
          href="/"
          prefetch={true}
          className="inline-flex min-h-10 w-fit items-center gap-2.5 rounded-lg text-lg font-black tracking-tight text-foreground transition-colors hover:text-warning-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar text-warning shadow-sm ring-1 ring-white/10">
            <CircleDot className="size-4.5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Оноо</span>
        </Link>

        {/* Navigation links — all items inline */}
        <ul className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    "group relative inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "bg-[var(--brand-sports)]/12 text-[var(--ink)] font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--brand-sports)]"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}

          {/* Search button */}
          <li className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenSearch}
              aria-label="Хайх (⌘K)"
              className="relative text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Search className="size-4" aria-hidden="true" />
              <kbd className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-[3px] border bg-muted font-mono text-[7px] font-medium text-muted-foreground/60 leading-none">
                <abbr title="Command" className="no-underline">⌘</abbr>
              </kbd>
            </Button>
          </li>
        </ul>

        {/* Right-side CTAs — Academy link + Shop button */}
        <div className="flex items-center gap-2">
          <Link
            href="/academy"
            className={cn(
              "inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive("/academy", pathname)
                ? "bg-[var(--brand-sports)]/12 text-[var(--ink)] font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-current={isActive("/academy", pathname) ? "page" : undefined}
          >
            Академи
          </Link>
          <Button asChild nativeButton={false} size="sm" className="gap-1.5 font-semibold">
            <Link
              href="/shop"
              className={cn(
                isActive("/shop", pathname) && "bg-[var(--brand-sports)]/20",
              )}
            >
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              Дэлгүүр
            </Link>
          </Button>
        </div>
      </nav>
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
