"use client";

import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

function SidebarSkeleton() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex h-8 items-center gap-3 px-2">
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      {[1, 2, 3, 4].map((i) => (
        <Fragment key={i}>
          {i > 1 && <SidebarSeparator />}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {[1, 2].map((j) => (
                  <SidebarMenuItem key={j}>
                    <div className="flex h-8 items-center gap-3 px-2">
                      <Skeleton className="size-4 shrink-0 rounded" />
                      <Skeleton className="h-3.5 w-20" />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </Fragment>
      ))}
      <SidebarSeparator />
    </>
  );
}

export function AppSidebar() {
  const t = useTranslations();
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgBranding />
      </SidebarHeader>
      <SidebarContent>
        {roleLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {/* Dashboard / Bay View */}
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
          </>
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
