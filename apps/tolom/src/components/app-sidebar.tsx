"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MechanicSwitcher } from "@/components/mechanic-switcher";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigation } from "@/hooks/use-navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { onLinkHover } from "@/lib/prefetch";

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {/* Header skeleton */}
      <div className="mb-3 flex items-center gap-3 px-2 py-1">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex h-8 items-center gap-3 px-2">
          <Skeleton className="size-4 shrink-0 rounded" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="ml-auto size-1.5 rounded-full" />
        </div>
      ))}
      {[1, 2, 3].map((g) => (
        <div key={g} className="flex flex-col gap-1 py-1">
          <Skeleton className="mb-1 h-3 w-14 px-2" />
          {[1, 2].map((j) => (
            <div key={j} className="flex h-8 items-center gap-3 px-2">
              <Skeleton className="size-4 shrink-0 rounded" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="ml-auto size-1.5 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const { push, prefetch } = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prefetch critical pages for faster navigation
    prefetch("/dashboard");
    prefetch("/dashboard/bay-view");
    prefetch("/dashboard/work-orders");
  }, [prefetch]);

  const {
    isActive,
    groups,
    utilityItems,
    primaryItems,
    settingsItems,
    roleLoading,
  } = useNavigation();

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      suppressHydrationWarning
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {!mounted || roleLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            <NavMain
              primaryItems={primaryItems}
              groups={groups}
              isActive={isActive}
              onNavigate={(href) => push(href)}
            />
            <NavProjects
              items={utilityItems}
              isActive={isActive}
              onNavigate={(href) => push(href)}
            />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => push(item.href)}
                  onMouseEnter={onLinkHover(item.href)}
                  isActive={isActive(item.href)}
                  tooltip={t(item.labelKey)}
                  size="sm"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <MechanicSwitcher />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <NavUser />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
