"use client";

import {
  CalendarPlus,
  Car,
  ClipboardList,
  FileText,
  LogOut,
  Settings,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import QueryProvider from "@/components/query-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/portal", labelKey: "portal.dashboard", icon: Wrench },
  { href: "/portal/vehicles", labelKey: "portal.vehicles", icon: Car },
  {
    href: "/portal/inspections",
    labelKey: "portal.inspections",
    icon: ClipboardList,
  },
  {
    href: "/portal/work-orders",
    labelKey: "portal.workOrders",
    icon: ClipboardList,
  },
  { href: "/portal/invoices", labelKey: "portal.invoices", icon: FileText },
  { href: "/portal/settings", labelKey: "portal.settings", icon: Settings },
  {
    href: "/portal/booking",
    labelKey: "portal.bookService",
    icon: CalendarPlus,
  },
];

function PortalLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { push } = useRouter();
  const pathname = usePathname();
  const { customer, loading } = usePortalAuth();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    push("/auth/customer/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </header>
        <main className="flex-1 p-4">
          <div className="mx-auto max-w-4xl flex flex-col gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={`skeleton-${i}`} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Typography.Muted className="text-sm text-muted-foreground">
          Redirecting to login…
        </Typography.Muted>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <Link
          href="/portal"
          className="flex items-center gap-2 font-semibold text-base"
        >
          <Wrench className="size-4 text-primary" />
          TOLOM
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-muted-foreground md:inline">
            {customer.full_name ?? customer.first_name ?? "Customer"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-xs"
          >
            <LogOut className="size-3.5" />
            {t("common.logout") ?? "Logout"}
          </Button>
        </div>
      </header>

      <nav className="overflow-x-auto border-b bg-muted/30 px-2 sm:px-4">
        <div className="flex min-w-max gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/portal"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-3.5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 px-4 py-5 sm:px-6 lg:py-6">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>

      <footer className="border-t py-3 text-center text-[10px] text-muted-foreground/50">
        TOLOM: Auto Service Management
      </footer>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <PortalLayoutContent>{children}</PortalLayoutContent>
    </QueryProvider>
  );
}
