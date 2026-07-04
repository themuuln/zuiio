"use client";

import { useTranslations } from "next-intl";
import { Fragment, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigation } from "@/hooks/use-navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { getNavStatusDotClass } from "@/lib/nav-feature-status";
import { onLinkHover } from "@/lib/prefetch";
import { MechanicSwitcher } from "./_mechanic-switcher";
import { OrgBranding } from "./_org-branding";

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
      <SidebarSeparator />
      {/* Primary nav skeleton */}
      <div className="flex flex-col gap-0.5 py-1">
        {[1, 2].map((i) => (
          <div key={i} className="flex h-8 items-center gap-3 px-2">
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="ml-auto size-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <SidebarSeparator />
      {/* Group nav skeletons */}
      {[1, 2, 3].map((g) => (
        <Fragment key={g}>
          {g > 1 && <SidebarSeparator />}
          <div className="flex flex-col gap-0.5 py-1">
            <Skeleton className="mb-1 h-3 w-14 px-2" />
            {[1, 2].map((j) => (
              <div key={j} className="flex h-8 items-center gap-3 px-2">
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="ml-auto size-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export function AppSidebar() {
  const t = useTranslations();
  const { push } = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isActive,
    groups,
    utilityItems,
    primaryItems,
    settingsItems,
    roleLoading,
  } = useNavigation();
  const settingsShortcut = settingsItems.find(
    (item) => item.href === "/dashboard/settings",
  );

  // Shared renderer for a nav item
  const renderNavItem = (item: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
  }) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        onClick={() => push(item.href)}
        onMouseEnter={onLinkHover(item.href)}
        isActive={isActive(item.href)}
        tooltip={t(item.labelKey)}
      >
        <item.icon className="size-4 shrink-0" />
        <span>{t(item.labelKey)}</span>
        <span
          className={`ml-auto size-1.5 rounded-full animate-status-pulse ${getNavStatusDotClass(item.href)}`}
          aria-hidden="true"
        />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar" suppressHydrationWarning>
      <SidebarHeader>
        <OrgBranding />
      </SidebarHeader>
      <SidebarContent>
        {!mounted || roleLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {/* Primary nav: Dashboard / Bay View */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>{primaryItems.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Feature nav groups */}
            {groups.map((group, i) => (
              <Fragment key={group.labelKey}>
                {i > 0 && <SidebarSeparator />}
                <SidebarGroup className="py-1">
                  {group.labelKey && (
                    <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {group.children.map(renderNavItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </Fragment>
            ))}

            <SidebarSeparator />

            {/* Management (admin-only: org, members, settings) */}
            {settingsItems.length > 0 && (
              <>
                <SidebarGroup className="py-1">
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {settingsItems.map(renderNavItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarSeparator />
              </>
            )}

            {/* Utility items (Guide) */}
            {utilityItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>{utilityItems.map(renderNavItem)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {settingsShortcut && renderNavItem(settingsShortcut)}
          <SidebarSeparator className="my-1" />
          <SidebarMenuItem>
            <MechanicSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
