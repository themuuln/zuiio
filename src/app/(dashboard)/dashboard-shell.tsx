"use client";

import { Drawer } from "@base-ui/react/drawer";
import {
  ArrowCounterClockwise,
  Buildings,
  Calculator,
  ChartBar,
  ClipboardText,
  Clock,
  Coin,
  CreditCard,
  CurrencyDollar,
  FileText,
  Folder,
  GearSix,
  House,
  Package,
  Percent,
  SignOut,
  Trolley,
  Users,
  Warehouse,
} from "@phosphor-icons/react";
import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { logout } from "@/app/(dashboard)/actions";
import { QuickCreateDropdown } from "@/components/erp/quick-create-dropdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NativeSelect } from "@/components/ui/native-select";
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
import {
  type BranchOption,
  BranchProvider,
  useBranchContext,
} from "@/lib/branch-context";
import { APP_NAME } from "@/lib/constants";
import { RealtimeSubscriptions } from "@/lib/query/realtime-subscriptions";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Үндсэн",
    items: [{ title: "Хяналтын самбар", href: "/", icon: House }],
  },
  {
    label: "Үйл ажиллагаа",
    items: [
      { title: "Борлуулалт", href: "/sales", icon: CurrencyDollar },
      { title: "Зарлага", href: "/expenses", icon: CreditCard },
      { title: "Худалдан авалт", href: "/purchases", icon: Trolley },
      { title: "Буцаалт", href: "/returns", icon: ArrowCounterClockwise },
    ],
  },
  {
    label: "Бүртгэл",
    items: [
      { title: "Бүтээгдэхүүн", href: "/products", icon: Package },
      { title: "Ангилалууд", href: "/inventory/categories", icon: Folder },
      { title: "Агуулах", href: "/inventory", icon: Warehouse },
      { title: "Харилцагчид", href: "/customers", icon: Users },
      { title: "Нийлүүлэгчид", href: "/suppliers", icon: Buildings },
    ],
  },
  {
    label: "Баримт бичиг",
    items: [
      { title: "Нэхэмжлэл", href: "/invoices", icon: FileText },
      { title: "Үнийн санал", href: "/quotations", icon: ClipboardText },
      { title: "Хямдрал", href: "/discounts", icon: Percent },
    ],
  },
  {
    label: "Шинжилгээ",
    items: [
      { title: "Тайлан", href: "/reports", icon: ChartBar },
      { title: "Комисс", href: "/commissions", icon: Coin },
      {
        title: "Нягтлан бодох бүртгэл",
        href: "/accounting",
        icon: Calculator,
      },
    ],
  },
  {
    label: "Систем",
    items: [
      { title: "Үйлдлийн түүх", href: "/audit", icon: Clock },
      { title: "Тохиргоо", href: "/settings", icon: GearSix },
    ],
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
  organizationId: string | null;
  organizationName: string | null;
  logoUrl: string | null;
  userFullName: string | null;
  branches: BranchOption[];
  userBranchId: string | null;
};

// ─── Branch Selector Inner ─────────────────────────────────────────────

function BranchSelector({ branches }: { branches: BranchOption[] }) {
  const {
    selectedBranchId,
    setSelectedBranchId,
    isBranchScoped,
    userBranchId,
  } = useBranchContext();

  if (isBranchScoped) {
    const currentBranch = branches.find((b) => b.id === userBranchId);
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">Салбар</p>
        <p className="truncate text-sm font-medium">
          {currentBranch?.name ?? "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <p className="text-xs text-muted-foreground">Салбар</p>
      <div className="relative mt-0.5">
        <NativeSelect
          value={selectedBranchId ?? ""}
          onChange={(e) => setSelectedBranchId(e.target.value || null)}
          className="w-full text-sm"
        >
          <option value="">Бүх салбар</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

// ─── Main Shell ────────────────────────────────────────────────────────

export function DashboardShell({
  children,
  organizationId,
  organizationName,
  logoUrl,
  userFullName,
  branches,
  userBranchId,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(
    !pathname.startsWith("/shop"),
  );
  const prevPathRef = React.useRef(pathname);

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
    <BranchProvider branches={branches} userBranchId={userBranchId}>
      <Drawer.Provider>
        <RealtimeSubscriptions orgId={organizationId} />
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
                      <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={organizationName ?? APP_NAME}
                            className="size-full object-contain"
                          />
                        ) : (
                          <PanelLeftIcon className="size-4" />
                        )}
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
                <BranchSelector branches={branches} />
              </SidebarHeader>

              <SidebarContent>
                {navGroups.map((group) => (
                  <SidebarGroup key={group.label}>
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = (() => {
                            if (pathname === item.href) return true;
                            if (item.href === "/") return false;
                            if (!pathname.startsWith(`${item.href}/`))
                              return false;
                            return !navGroups.some((g) =>
                              g.items.some(
                                (other) =>
                                  other.href !== item.href &&
                                  other.href.length > item.href.length &&
                                  other.href.startsWith(item.href) &&
                                  (pathname === other.href ||
                                    pathname.startsWith(`${other.href}/`)),
                              ),
                            );
                          })();

                          return (
                            <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.title}
                              >
                                <Link href={item.href}>
                                  <Icon />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
              </SidebarContent>

              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/settings">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {userFullName || "Хэрэглэгч"}
                        </span>
                      </Link>
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
                <div className="ml-auto">
                  {organizationId && (
                    <QuickCreateDropdown organizationId={organizationId} />
                  )}
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Drawer.Indent>
      </Drawer.Provider>
    </BranchProvider>
  );
}
