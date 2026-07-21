"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ViewTransition } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { onLinkHover } from "@/lib/prefetch";

export interface UtilityItemData {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export function NavProjects({
  items,
  isActive,
  onNavigate,
}: {
  items: UtilityItemData[];
  isActive: (href: string) => boolean;
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <ViewTransition>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.href)}
                    onMouseEnter={onLinkHover(item.href)}
                    isActive={isActive(item.href)}
                    tooltip={t(item.labelKey)}
                    size="sm"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </ViewTransition>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
