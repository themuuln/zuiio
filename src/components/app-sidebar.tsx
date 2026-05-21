"use client";

import { Moon, Sun, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { mechanicKeys, orgKeys } from "@/lib/queries/keys";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigation } from "@/hooks/use-navigation";

const MECHANIC_STORAGE_KEY = "tolom_active_mechanic";

function MechanicSwitcher() {
  const { isMobile } = useSidebar();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;

  const [activeMechanicId, setActiveMechanicId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id?: string; full_name?: string | null } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(MECHANIC_STORAGE_KEY);
    if (stored) {
      setActiveMechanicId(stored);
      return;
    }
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d?.profile ?? d?.data ?? d;
        if (p?.id) {
          setProfile(p);
          setActiveMechanicId(p.id);
        }
      })
      .catch(() => {});
  }, []);

  const { data: mechanics = [] } = useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/reports?type=mechanics`);
      const json = await res.json();
      return (json.data ?? []) as { id: string; full_name: string }[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const activeMechanic = mechanics.find((m) => m.id === activeMechanicId) ?? null;
  const displayName = activeMechanic?.full_name ?? profile?.full_name ?? "Mechanic";
  const initials = getInitials(displayName);

  const handleSwitch = useCallback(
    (mechanicId: string | null) => {
      const id = mechanicId ?? profile?.id ?? "";
      setActiveMechanicId(id);
      localStorage.setItem(MECHANIC_STORAGE_KEY, id);
    },
    [profile],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="sm"
            className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
          />
        }
      >
        <Avatar className="size-5 shrink-0">
          <AvatarFallback className="text-[8px] font-medium bg-sidebar-accent text-sidebar-accent-foreground">
            <Wrench className="size-3" />
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate text-xs font-medium">{displayName}</span>
          <span className="truncate text-[10px] text-sidebar-foreground/50">
            {mechanics.length > 0 ? `${mechanics.length} mechanics` : "No mechanics"}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-48 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          Switch Mechanic
        </div>
        {mechanics.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground/50 text-center">
            No mechanics found
          </div>
        )}
        {mechanics.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => handleSwitch(m.id)}
            className="gap-2"
          >
            <Avatar className="size-5">
              <AvatarFallback className="text-[8px] font-medium">
                {getInitials(m.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-xs">{m.full_name ?? "Unknown"}</span>
            {m.id === activeMechanicId && (
              <span className="text-[10px] text-primary font-medium">Active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function NavUser() {
  const { isMobile } = useSidebar();
  const t = useTranslations("userMenu");
  const [profile, setProfile] = useState<{
    fullName?: string | null;
    email?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.fullName ?? "User";
  const email = profile?.email ?? "";
  const initials = getInitials(profile?.fullName);

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
          />
        }
      >
        <Avatar className="size-6 shrink-0">
          <AvatarFallback className="text-[10px] font-medium">
            {loading ? "…" : initials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{loading ? "…" : displayName}</span>
          <span className="truncate text-[11px] text-sidebar-foreground/50">
            {loading ? "" : email || "Signed in"}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">{loading ? "…" : initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-[11px] text-muted-foreground">{email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const t = useTranslations();
  const { standalone, groups, settingsGroup, isActive } = useNavigation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
  const isDark = mounted && theme === "dark";

  function renderNavItem(item: { href: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }) {
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
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={org?.name ?? "TOLOM"}
                    className="size-6 rounded object-contain"
                  />
                ) : (
                  <span className="text-xs font-semibold">T</span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {org?.name ?? "TOLOM"}
                </span>
              </div>
              <SidebarTrigger className="-mr-1" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {standalone.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel className="h-6">
              {t(group.labelKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.children.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel className="h-6">
            {t(settingsGroup.labelKey)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsGroup.children.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <MechanicSwitcher />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              tooltip={mounted ? (isDark ? "Light mode" : "Dark mode") : undefined}
            >
              {mounted && (isDark ? <Sun /> : <Moon />)}
              {!mounted && <div className="size-4" />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <NavUser />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
