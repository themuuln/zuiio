"use client";

import { useTranslations } from "next-intl";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useNavigation } from "@/hooks/use-navigation";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { MechanicSwitcher } from "./_mechanic-switcher";
import { OrgBranding } from "./_org-branding";

export function AppSidebar() {
  const t = useTranslations();
  const { isActive, groups, utilityItems, primaryItems, groupHasActive } = useNavigation();

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
                    render={<Link href={item.href} />}
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
        {groups.map((group) => {
          const GroupIcon = group.icon;
          const isCollapsible = group.isCollapsible !== false;
          const hasActiveChild = groupHasActive(group);

          if (isCollapsible) {
            return (
              <SidebarGroup key={group.labelKey} className="py-1">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible defaultOpen={hasActiveChild} className="group/collapsible">
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton
                            isActive={hasActiveChild}
                            tooltip={t(group.labelKey)}
                            className="w-full justify-between"
                          />
                        }
                      >
                        <span className="flex items-center gap-2">
                          <GroupIcon className="size-4 shrink-0" />
                          <span>{t(group.labelKey)}</span>
                        </span>
                        <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-sidebar-foreground/35" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="gap-0.5 mt-1 border-l border-sidebar-border/60 ml-[18px] pl-2">
                          {group.children.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                render={<Link href={item.href} />}
                                isActive={isActive(item.href)}
                                className={cn(
                                  "flex h-7 w-full items-center gap-2 rounded-lg px-2 text-[11px] font-normal transition-colors",
                                  "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                                  "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm data-[active=true]:font-medium"
                                )}
                              >
                                <item.icon className="size-3.5 shrink-0" />
                                <span>{t(item.labelKey)}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          return (
            <SidebarGroup key={group.labelKey} className="py-1">
              <SidebarGroupLabel className="h-6.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                {t(group.labelKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.children.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
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
          );
        })}

        <SidebarSeparator />

        {/* Utility items (Guide) */}
        {utilityItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {utilityItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
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
          <SidebarMenuItem>
            <MechanicSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
