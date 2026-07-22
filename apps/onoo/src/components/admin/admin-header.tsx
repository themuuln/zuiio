"use client";

import { ChevronDown, LogOut, Menu, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminLayout } from "./admin-layout-context";

/** Admin route -> Mongolian breadcrumb label map */
const breadcrumbLabels: Record<string, string> = {
  admin: "Хянах самбар",
  leagues: "Лиг",
  seasons: "Улирал",
  competitions: "Тэмцээн",
  teams: "Баг",
  players: "Тоглогч",
  games: "Тоглолт",
  venues: "Талбай",
  products: "Бүтээгдэхүүн",
  orders: "Захиалга",
  ops: "Үйлдлүүд",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Only show admin path segments after /admin
  const adminIndex = segments.indexOf("admin");
  if (adminIndex === -1) return [{ href: "/admin", label: "Хянах самбар" }];

  const crumbs: { href: string; label: string }[] = [];
  let href = "";

  for (let i = 0; i <= adminIndex; i++) {
    href += `/${segments[i]}`;
  }
  crumbs.push({ href, label: "Хянах самбар" });

  for (let i = adminIndex + 1; i < segments.length; i++) {
    const seg = segments[i]!;
    href += `/${seg}`;
    const label = breadcrumbLabels[seg] ?? seg;
    // Skip dynamic segments (UUIDs, numbers — no label)
    if (/^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg)) continue;
    crumbs.push({ href, label });
  }

  return crumbs;
}

export function AdminHeader() {
  const { toggleMobileSidebar } = useAdminLayout();
  const breadcrumbs = useBreadcrumbs();
  const [_searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center border-b bg-background px-4 md:left-64">
      {/* Left: mobile menu toggle + breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={toggleMobileSidebar}
          aria-label="Нээх цэс"
        >
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumb */}
        <nav
          aria-label="Талхны хэлтэс"
          className="flex min-w-0 items-center gap-1.5 text-sm"
        >
          {breadcrumbs.map((crumb, i) => (
            <span
              key={crumb.href}
              className="flex min-w-0 items-center gap-1.5"
            >
              {i > 0 && (
                <span className="text-muted-foreground/40 select-none">/</span>
              )}
              {i === breadcrumbs.length - 1 ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search + language + user */}
      <div className="flex items-center gap-2">
        {/* Search button (Cmd+K) */}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 text-muted-foreground md:inline-flex"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-3.5" />
          <span className="text-xs">Хайх...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <LanguageSwitcher />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-3.5" />
              </div>
              <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Админ</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <User className="mr-2 size-4" />
                Хянах самбар
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/login?signout=true">
                <LogOut className="mr-2 size-4" />
                Гарах
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
