"use client";

import { useTranslations } from "next-intl";
import { Fragment } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/hooks/use-navigation";
import { Link } from "@/lib/i18n/navigation";
import { onLinkHover } from "@/lib/prefetch";
import { MechanicSwitcher } from "./_mechanic-switcher";
import { OrgBranding } from "./_org-branding";

export function AppSidebar() {
  const t = useTranslations();
  const { isActive, groups, utilityItems, primaryItems, settingsItems } =
    useNavigation();
  const settingsShortcut = settingsItems.find(
    (item) => item.href === "/dashboard/settings",
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgBranding />
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={
                      <Link
                        href={item.href}
                        onMouseEnter={onLinkHover(item.href)}
                      />
                    }
                    isActive={isActive(item.href)}
                    tooltip={t(item.labelKey)}
                  >
                    <item.icon className="size-4" />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* All nav groups */}
        {groups.map((group, i) => (
          <Fragment key={group.labelKey}>
            {i > 0 && <SidebarSeparator />}
            <SidebarGroup className="py-1">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.children.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={item.href}
                            onMouseEnter={onLinkHover(item.href)}
                          />
                        }
                        isActive={isActive(item.href)}
                        tooltip={t(item.labelKey)}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{t(item.labelKey)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </Fragment>
        ))}

        <SidebarSeparator />

        {/* Utility items (Guide) */}
        {utilityItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {utilityItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.href}
                          onMouseEnter={onLinkHover(item.href)}
                        />
                      }
                      isActive={isActive(item.href)}
                      tooltip={t(item.labelKey)}
                    >
                      <item.icon className="size-4" />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {settingsShortcut && (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link
                    href={settingsShortcut.href}
                    onMouseEnter={onLinkHover(settingsShortcut.href)}
                  />
                }
                isActive={isActive(settingsShortcut.href)}
                tooltip={t(settingsShortcut.labelKey)}
              >
                <settingsShortcut.icon className="size-4" />
                <span>{t(settingsShortcut.labelKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <MechanicSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
