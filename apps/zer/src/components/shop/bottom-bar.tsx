"use client";

import {
  Barcode,
  ClockCounterClockwise,
  ShoppingCart,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { useShopHistoryDrawer } from "@/components/shop/shop-history-drawer";
import { cn } from "@/lib/utils";

const tabs = [
  {
    label: "Бараа",
    href: "/shop",
    icon: Barcode,
  },
  {
    label: "Сагс",
    href: "/shop/cart",
    icon: ShoppingCart,
  },
  {
    label: "Түүх",
    href: "/shop/history",
    icon: ClockCounterClockwise,
  },
] as const;

export function BottomBar() {
  const pathname = usePathname();
  const historyDrawer = useShopHistoryDrawer();
  const { itemCount } = useCart();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <nav
      aria-label="Үндсэн навигац"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 h-16 bg-card",
        "border-t border-border",
        "shadow-sm transition-shadow",
        "lg:hidden",
      )}
    >
      <div className="mx-auto flex h-full max-w-3xl items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/shop"
              ? pathname === "/shop"
              : pathname.startsWith(tab.href);

          // "Түүх" opens a drawer instead of navigating
          if (tab.href === "/shop/history") {
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => historyDrawer.open()}
                className={cn(
                  "relative flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-md px-3 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative transition-transform duration-200">
                  <Icon
                    className={cn(
                      "size-5 transition-all duration-200",
                      isActive ? "scale-110" : "scale-100",
                    )}
                    weight={isActive ? "fill" : "regular"}
                  />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-md px-3 text-xs font-medium transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative transition-transform duration-200">
                <Icon
                  className={cn(
                    "size-5 transition-all duration-200",
                    isActive ? "scale-110" : "scale-100",
                  )}
                  weight={isActive ? "fill" : "regular"}
                />
                {mounted && tab.href === "/shop/cart" && itemCount > 0 && (
                  <span
                    className={cn(
                      "absolute -right-2 -top-1.5",
                      "flex min-w-[18px] items-center justify-center",
                      "rounded-full bg-primary px-1 py-0.5",
                      "text-[10px] font-bold leading-none text-primary-foreground",
                      "transition-all duration-200",
                    )}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
