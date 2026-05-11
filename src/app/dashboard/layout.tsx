"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigation } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

function MobileOverlay() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  if (!mobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 lg:hidden"
      onClick={() => setMobileOpen(false)}
      aria-hidden="true"
    />
  );
}

function Sidebar() {
  const { collapsed, mobileOpen } = useSidebar();
  const pathname = usePathname();
  const { mainItems, settingsItems } = useNavigation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:relative lg:translate-x-0",
        collapsed && "lg:w-16",
        !mobileOpen && "-translate-x-full lg:translate-x-0",
      )}
    >
      {/* Branding */}
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b border-sidebar-border px-4",
          collapsed && "lg:justify-center lg:px-2",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
            T
          </span>
          {!collapsed && <span>TOLOM</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5">
          {mainItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70",
                    collapsed && "lg:justify-center lg:px-0",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Settings section */}
        <div className="mt-4">
          <div
            className={cn(
              "mb-1 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider",
              collapsed && "lg:hidden",
            )}
          >
            Settings
          </div>
          <ul className="flex flex-col gap-0.5">
            {settingsItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70",
                      collapsed && "lg:justify-center lg:px-0",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User menu footer */}
      <div
        className={cn(
          "border-t border-sidebar-border p-2",
          collapsed && "lg:flex lg:justify-center",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "lg:w-auto lg:justify-center",
            )}
          >
            <Avatar className="size-8">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 truncate text-left">
                <div className="text-sm font-medium leading-none">John Doe</div>
                <div className="text-xs text-sidebar-foreground/60 truncate">
                  john@tolom.com
                </div>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">John Doe</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { setMobileOpen } = useSidebar();

  return (
    <div className="flex h-14 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </Button>
      <Link href="/dashboard" className="font-semibold text-lg tracking-tight">
        TOLOM
      </Link>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-full">
        <MobileOverlay />
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
