"use client";

import { Drawer } from "@base-ui/react/drawer";
import {
  MapPin,
  Plus,
  SignOut,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useMemo, ViewTransition } from "react";
import { logout } from "@/app/(dashboard)/actions";
import { QuickCreateDropdown } from "@/components/erp/quick-create-dropdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
import { type BranchOption, useBranchContext } from "@/lib/branch-context";
import { APP_NAME } from "@/lib/constants";
import { filterNavGroups, type NavGroup, navGroups } from "@/lib/navigation";
import {
  type OrgSettings,
  OrgSettingsProvider,
} from "@/lib/org-settings-context";
import { RealtimeSubscriptions } from "@/lib/query/realtime-subscriptions";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  organizationId: string | null;
  organizationName: string | null;
  logoUrl: string | null;
  userFullName: string | null;
  userEmail: string | null;
  enabledFeatures: string[];
  hasMultiBranch: boolean;
  orgSettings: OrgSettings;
};

// ─── Sidebar nav content component (shared between shop & non-shop) ────────

function SidebarNav({
  logoUrl,
  organizationName,
  userFullName,
  userEmail,
  initials,
  isBranchScoped,
  hasMultiBranch,
  currentBranch,
  selectedBranchId,
  handleBranchChange,
  branches,
  visibleGroups,
  pathname,
}: {
  logoUrl: string | null;
  organizationName: string | null;
  userFullName: string | null;
  userEmail: string | null;
  initials: string;
  isBranchScoped: boolean;
  hasMultiBranch: boolean;
  currentBranch?: { name: string };
  selectedBranchId: string | null;
  handleBranchChange: (id: string) => void;
  branches: BranchOption[];
  visibleGroups: NavGroup[];
  pathname: string;
}) {
  return (
    <>
      <SidebarHeader>
        {isBranchScoped || !hasMultiBranch ? (
          <div className="flex items-center gap-2 overflow-hidden rounded-md border border-sidebar-border/40 bg-sidebar-accent/30 p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
              {logoUrl ? (
                <OptimizedImage
                  src={logoUrl}
                  alt={organizationName ?? APP_NAME}
                  width={32}
                  height={32}
                  className="size-full object-contain"
                  priority
                />
              ) : (
                <PanelLeftIcon className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">
                {organizationName || APP_NAME}
              </span>
              <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                {isBranchScoped ? (
                  <>
                    <MapPin className="size-3 shrink-0" weight="fill" />
                    {currentBranch?.name ?? "—"}
                  </>
                ) : (
                  <>
                    <Storefront className="size-3 shrink-0" />
                    {organizationName || APP_NAME}
                  </>
                )}
              </span>
            </div>
          </div>
        ) : (
          <Select
            value={selectedBranchId ?? ""}
            onValueChange={(value) => {
              if (value !== null) handleBranchChange(value);
            }}
          >
            <SelectTrigger
              className={cn(
                "flex w-full items-center gap-3 overflow-hidden rounded-md p-3 text-left text-sm",
                "ring-sidebar-ring outline-hidden transition-[width,height,padding]",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
                "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center",
                "group-data-[collapsible=icon]:[&>svg:last-child]:hidden",
                "border border-sidebar-border/40 bg-sidebar-accent/30 shadow-none",
                "h-auto",
                "data-[placeholder]:text-inherit",
              )}
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:size-6">
                {logoUrl ? (
                  <OptimizedImage
                    src={logoUrl}
                    alt={organizationName ?? APP_NAME}
                    className="size-full object-contain"
                    priority
                  />
                ) : (
                  <PanelLeftIcon className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {organizationName || APP_NAME}
                </span>
                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  {currentBranch ? (
                    <MapPin className="size-3 shrink-0" weight="fill" />
                  ) : (
                    <Storefront className="size-3 shrink-0" />
                  )}
                  {currentBranch?.name ?? "Бүх салбар"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent
              align="start"
              side="bottom"
              sideOffset={4}
              className="max-h-[50vh] min-w-[14rem]"
            >
              <SelectItem value="">
                <Storefront className="size-4" />
                Бүх салбар
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <MapPin className="size-4" weight="fill" />
                  {b.name}
                </SelectItem>
              ))}
              <Separator className="my-1" />
              <SelectItem value="__create">
                <Plus className="size-4" />
                Шинэ салбар
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </SidebarHeader>

      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = (() => {
                    if (pathname === item.href) return true;
                    if (item.href === "/") return false;
                    if (!pathname.startsWith(`${item.href}/`)) return false;
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
                      <ViewTransition>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          render={<Link href={item.href} />}
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </ViewTransition>
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
            <ViewTransition>
              <SidebarMenuButton render={<Link href="/settings" />}>
                <Avatar className="size-6">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {userFullName ||
                    (userEmail ? userEmail.split("@")[0] : "Хэрэглэгч")}
                </span>
              </SidebarMenuButton>
            </ViewTransition>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ViewTransition>
              <form action={logout}>
                <SidebarMenuButton type="submit">
                  <SignOut />
                  <span>Гарах</span>
                </SidebarMenuButton>
              </form>
            </ViewTransition>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}
// ─── Main Shell ────────────────────────────────────────────────────────

export function DashboardShell({
  children,
  organizationId,
  organizationName,
  logoUrl,
  userFullName,
  userEmail,
  enabledFeatures,
  hasMultiBranch,
  orgSettings,
}: DashboardShellProps) {
  const visibleGroups = React.useMemo(
    () => filterNavGroups(navGroups, enabledFeatures, hasMultiBranch),
    [enabledFeatures, hasMultiBranch],
  );
  const orgSettingsValue = useMemo(
    () => ({ ...orgSettings, organizationId: organizationId ?? "" }),
    [orgSettings, organizationId],
  );

  const pathname = usePathname();
  const router = useRouter();
  // Prefetch critical pages for instant navigation
  React.useEffect(() => {
    router.prefetch("/");
    router.prefetch("/sales");
    router.prefetch("/products");
  }, [router]);
  const searchParams = useSearchParams();
  const {
    selectedBranchId,
    setSelectedBranchId,
    isBranchScoped,
    userBranchId,
    branches,
  } = useBranchContext();
  const currentBranch = branches.find(
    (b) => b.id === (isBranchScoped ? userBranchId : selectedBranchId),
  );

  const [sidebarOpen, setSidebarOpen] = React.useState(
    !pathname.startsWith("/shop"),
  );
  const prevPathRef = React.useRef(pathname);

  const handleBranchChange = (newId: string) => {
    if (newId === "__create") {
      router.push("/settings/branches");
      return;
    }
    const branchId = newId || null;
    setSelectedBranchId(branchId);
    const params = new URLSearchParams(searchParams.toString());
    if (branchId) {
      params.set("branch", newId);
    } else {
      params.delete("branch");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

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

  // Display name with email prefix fallback
  const displayName =
    userFullName ?? (userEmail ? userEmail.split("@")[0] : null) ?? "Хэрэглэгч";

  const initials =
    displayName && displayName !== "Хэрэглэгч"
      ? displayName
          .split(" ")
          .map((name) => name[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : userEmail
        ? userEmail[0].toUpperCase()
        : "?";

  const isShop = pathname.startsWith("/shop");
  return (
    <Drawer.Provider>
      <RealtimeSubscriptions orgId={organizationId} />
      {isShop ? (
        <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <Sidebar collapsible="offcanvas" className="z-50">
            <SidebarNav
              logoUrl={logoUrl}
              organizationName={organizationName}
              userFullName={userFullName}
              userEmail={userEmail}
              initials={initials}
              isBranchScoped={isBranchScoped}
              hasMultiBranch={hasMultiBranch}
              currentBranch={currentBranch}
              selectedBranchId={selectedBranchId}
              handleBranchChange={handleBranchChange}
              branches={branches}
              visibleGroups={visibleGroups}
              pathname={pathname}
            />
          </Sidebar>
          <div className="flex min-h-svh w-full flex-1 flex-col">
            <OrgSettingsProvider value={orgSettingsValue}>
              {children}
            </OrgSettingsProvider>
          </div>
        </SidebarProvider>
      ) : (
        <>
          <Drawer.IndentBackground className="pointer-events-none fixed inset-0 z-10 bg-black/10 opacity-0 transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-active:opacity-100 dark:bg-black/40" />
          <Drawer.Indent
            className="relative z-0 min-h-dvh transition-[transform,border-radius] ease-[cubic-bezier(0.32,0.72,0,1)] data-active:origin-[center_top] data-active:scale-[calc(0.97+0.03*var(--drawer-swipe-progress))] data-active:translate-y-[calc(0.5rem*(1-var(--drawer-swipe-progress)))] data-active:rounded-tl-2xl data-active:rounded-tr-2xl"
            style={
              {
                "--indent-transition":
                  "calc(1 - clamp(0, calc(var(--drawer-swipe-progress) * 100000), 1))",
                transitionDuration:
                  "calc(450ms * var(--indent-transition)), calc(350ms * var(--indent-transition))",
              } as React.CSSProperties
            }
          >
            <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <Sidebar collapsible="icon">
                <SidebarNav
                  logoUrl={logoUrl}
                  organizationName={organizationName}
                  userFullName={userFullName}
                  userEmail={userEmail}
                  initials={initials}
                  isBranchScoped={isBranchScoped}
                  hasMultiBranch={hasMultiBranch}
                  currentBranch={currentBranch}
                  selectedBranchId={selectedBranchId}
                  handleBranchChange={handleBranchChange}
                  branches={branches}
                  visibleGroups={visibleGroups}
                  pathname={pathname}
                />
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
                  <OrgSettingsProvider value={orgSettingsValue}>
                    {children}
                  </OrgSettingsProvider>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </Drawer.Indent>
        </>
      )}
    </Drawer.Provider>
  );
}
