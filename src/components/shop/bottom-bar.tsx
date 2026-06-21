"use client";

import {
  Barcode,
  ClockCounterClockwise,
  ShoppingCart,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
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
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-card shadow-lg">
      <div className="mx-auto flex h-full items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/shop"
              ? pathname === "/shop"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-md px-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icon
                  className="size-5"
                  weight={isActive ? "fill" : "regular"}
                />
                {tab.href === "/shop/cart" && itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
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
