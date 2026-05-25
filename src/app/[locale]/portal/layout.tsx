"use client";

import { Car, FileText, LogOut, Settings, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/portal", labelKey: "portal.dashboard", icon: Wrench },
  { href: "/portal/vehicles", labelKey: "portal.vehicles", icon: Car },
  { href: "/portal/invoices", labelKey: "portal.invoices", icon: FileText },
  { href: "/portal/settings", labelKey: "portal.settings", icon: Settings },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const { push } = useRouter();
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
        <p className="text-sm text-muted-foreground">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 sticky top-0 z-10">
        <Link href="/portal" className="flex items-center gap-2 font-semibold text-base">
          <Wrench className="size-4 text-primary" />
          TOLOM
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground">
            {customer.full_name ?? customer.first_name ?? "Customer"}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs gap-1.5">
            <LogOut className="size-3.5" />
            {t("common.logout") ?? "Logout"}
          </Button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="flex gap-1 border-b bg-muted/30 px-4 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors shrink-0",
                "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 lg:p-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      <footer className="border-t py-3 text-center text-[10px] text-muted-foreground/50">
        TOLOM: Auto Service Management
      </footer>
    </div>
  );
}
