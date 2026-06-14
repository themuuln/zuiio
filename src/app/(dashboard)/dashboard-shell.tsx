"use client";

import { Drawer } from "@base-ui/react/drawer";
import {
  Buildings,
  CreditCard,
  CurrencyDollar,
  GearSix,
  House,
  Package,
  SidebarIcon,
  SignOut,
  Users,
  Warehouse,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { logout } from "@/app/(dashboard)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { title: "Хяналтын самбар", href: "/", icon: House },
  { title: "Бүтээгдэхүүн", href: "/products", icon: Package },
  { title: "Агуулах", href: "/inventory", icon: Warehouse },
  { title: "Борлуулалт", href: "/sales", icon: CurrencyDollar },
  { title: "Зарлага", href: "/expenses", icon: CreditCard },
  { title: "Харилцагчид", href: "/customers", icon: Users },
  { title: "Нийлүүлэгчид", href: "/suppliers", icon: Buildings },
  { title: "Тохиргоо", href: "/settings", icon: GearSix },
] as const;

type DashboardShellProps = {
  children: React.ReactNode;
  organizationName: string | null;
  userFullName: string | null;
};

export function DashboardShell({
  children,
  organizationName,
  userFullName,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(
    !pathname.startsWith("/shop"),
  );
  const prevPathRef = React.useRef(pathname);

  // Auto-collapse sidebar when entering /shop routes, restore when leaving
  React.useEffect(() => {
    const wasShop = prevPathRef.current.startsWith("/shop");
    const isShop = pathname.startsWith("/shop");

    if (isShop && !wasShop) {
      setSidebarOpen(false);
    } else if (!isShop && wasShop) {
      setSidebarOpen(true);
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  const initials = userFullName
    ? userFullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <Drawer.Provider>
      <Drawer.IndentBackground className="pointer-events-none fixed inset-0 z-10 bg-black/10 opacity-0 transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-active:opacity-100 dark:bg-black/40" />
      <Drawer.Indent className="relative z-0 min-h-dvh transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-active:origin-[center_top] data-active:scale-[0.97] data-active:rounded-xl">
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <SidebarIcon className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {organizationName || APP_NAME}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        Mini ERP
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Цэс</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} prefetch={false} />}
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/settings" prefetch={false} />}
                  >
                    <Avatar className="size-6">
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {userFullName || "Хэрэглэгч"}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <form action={logout}>
                    <SidebarMenuButton type="submit">
                      <SignOut />
                      <span>Гарах</span>
                    </SidebarMenuButton>
                  </form>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </Drawer.Indent>
    </Drawer.Provider>
  );
}
