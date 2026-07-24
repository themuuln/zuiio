"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, ViewTransition } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { onLinkHover } from "@/lib/prefetch";

export interface NavSubItemData {
  labelKey: string;
  href: string;
}

export interface NavItemData {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  children?: NavSubItemData[];
}

export interface NavGroupData {
  labelKey: string;
  icon: LucideIcon;
  children: NavItemData[];
}

export function NavMain({
  primaryItems,
  groups,
  isActive,
  onNavigate,
}: {
  primaryItems: NavItemData[];
  groups: NavGroupData[];
  isActive: (href: string) => boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <>
      {/* Primary items (Dashboard) */}
      {primaryItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <NavItemRow
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Nav groups with collapsible sub-items */}
      {groups.map((group) => {
        return (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.children.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <CollapsibleNavItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onNavigate={onNavigate}
                    />
                  ) : (
                    <NavItemRow
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onNavigate={onNavigate}
                    />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}

/** Flat nav item (no children) — just a clickable link */
function NavItemRow({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItemData;
  isActive: (href: string) => boolean;
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations();
  const Icon = item.icon;

  return (
    <SidebarMenuItem className="w-full">
      <ViewTransition>
        <SidebarMenuButton
          onClick={() => onNavigate(item.href)}
          onMouseEnter={onLinkHover(item.href)}
          isActive={isActive(item.href)}
          tooltip={t(item.labelKey)}
        >
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{t(item.labelKey)}</span>
        </SidebarMenuButton>
      </ViewTransition>
    </SidebarMenuItem>
  );
}

/** Collapsible nav item with sub-items — sidebar-07 style */
function CollapsibleNavItem({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItemData;
  isActive: (href: string) => boolean;
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations();
  const Icon = item.icon;
  const defaultOpen =
    isActive(item.href) ||
    (item.children?.some((c) => isActive(c.href)) ?? false);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible w-full"
    >
      <SidebarMenuItem className="w-full">
        <ViewTransition>
          <SidebarMenuButton
            render={<CollapsibleTrigger />}
            onClick={() => onNavigate(item.href)}
            onMouseEnter={onLinkHover(item.href)}
            isActive={isActive(item.href)}
            tooltip={t(item.labelKey)}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(item.labelKey)}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </ViewTransition>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <ViewTransition>
                  <SidebarMenuSubButton
                    render={<button type="button" />}
                    onClick={() => onNavigate(subItem.href)}
                    onMouseEnter={onLinkHover(subItem.href)}
                    isActive={isActive(subItem.href)}
                    className="w-full cursor-pointer"
                  >
                    <Icon className="size-4 shrink-0 text-sidebar-foreground/40" />
                    <span className="truncate">{t(subItem.labelKey)}</span>
                  </SidebarMenuSubButton>
                </ViewTransition>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
