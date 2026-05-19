"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization } from "@/lib/types";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/hooks/use-navigation";
import ThemeToggle from "@/components/theme-toggle";
import UserMenu from "@/components/user-menu";

function SidebarItemList({
  items,
  t,
  isActive,
}: {
  items: Array<{
    href: string;
    labelKey: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  t: (key: string) => string;
  isActive: (href: string) => boolean;
}) {
  return items.map((item) => {
    const Icon = item.icon;
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          size="sm"
          render={<Link href={item.href} />}
          isActive={isActive(item.href)}
          tooltip={t(item.labelKey)}
        >
          <Icon />
          <span>{t(item.labelKey)}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });
}

export function AppSidebar() {
  const t = useTranslations();
  const { standalone, groups, settingsGroup, isActive } = useNavigation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const { data: orgInfo } = useCurrentOrg();
  const { data: org } = useQuery({
    queryKey: orgKeys.detail(orgInfo?.orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgInfo?.orgId}`);
      const json = await res.json();
      return json.data as Organization;
    },
    enabled: !!orgInfo?.orgId,
    staleTime: 60_000,
  });

  const logoUrl = org?.logo_url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-1 py-0.5 group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            {logoUrl ? (
              // TODO: use next/image for optimized images
              <img
                src={logoUrl}
                alt={org?.name ?? "TOLOM"}
                className="size-7 rounded-md object-contain"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                T
              </span>
            )}
            <span className="truncate text-sm font-semibold group-data-[state=collapsed]:hidden">
              {org?.name ?? "TOLOM"}
            </span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="p-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarItemList items={standalone} t={t} isActive={isActive} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {groups.map((group) => (
          <SidebarGroup key={group.labelKey} className="p-1">
            <SidebarGroupLabel className="h-6">{t(group.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarItemList items={group.children} t={t} isActive={isActive} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="h-6">{t(settingsGroup.labelKey)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarItemList items={settingsGroup.children} t={t} isActive={isActive} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-0.5 p-1">
          <ThemeToggle collapsed={collapsed} />
          <UserMenu collapsed={collapsed} />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
