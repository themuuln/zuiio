"use client";

import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarState } from "@/app/(dashboard)/dashboard-shell";
import { useShopHistoryDrawer } from "@/components/shop/shop-history-drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const desktopNavLinks: { label: string; href: string }[] = [
  { label: "Бараа", href: "/shop" },
  { label: "Түүх", href: "/shop/history" },
];

/**
 * Shop header with a sidebar toggle button.
 * On desktop the bottom tab bar is hidden, so navigation links live here.
 * "Түүх" opens a slide-in drawer instead of navigating.
 */
export function ShopHeaderClient() {
  const { open, setOpen } = useSidebarState();
  const pathname = usePathname();
  const historyDrawer = useShopHistoryDrawer();

  return (
    <header className="sticky top-0 z-40 flex h-[52px] items-center border-b border-border bg-card px-4">
      <div className="flex w-full items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setOpen(!open)}
          aria-label="Хажуугийн цэс"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
        <span className="text-sm font-semibold">Дэлгүүр</span>

        <nav
          aria-label="Дэлгүүрийн навигац"
          className="ml-auto hidden items-center gap-1 lg:flex"
        >
          {desktopNavLinks.map((link) => {
            // "Түүх" opens a drawer instead of navigating
            if (link.href === "/shop/history") {
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => historyDrawer.open()}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith(link.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {link.label}
                </button>
              );
            }

            const isActive =
              link.href === "/shop"
                ? pathname === "/shop"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
