"use client";

import { ArrowLeft, MapPin, Receipt, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Shared header for the buyer account area. Links back to the store and
 * between the account home and order history pages.
 */
export function AccountHeader({
  slug,
  orgName,
}: {
  slug: string;
  orgName: string;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isOrders = pathname?.endsWith("/orders");
  const isAddresses = pathname?.endsWith("/addresses");
  const isAccountHome = !isOrders && !isAddresses;

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href={`/${slug}`}
          className="flex min-w-0 items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="truncate">{orgName}</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href={`/${slug}/account`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              isAccountHome
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <UserCircle className="size-4" />
            {t("storeAccount.account")}
          </Link>
          <Link
            href={`/${slug}/account/orders`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              isOrders
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Receipt className="size-4" />
            {t("storeAccount.ordersLink")}
          </Link>
          <Link
            href={`/${slug}/account/addresses`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              isAddresses
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapPin className="size-4" />
            Хаягийн дэвтэр
          </Link>
        </nav>
      </div>
    </header>
  );
}
