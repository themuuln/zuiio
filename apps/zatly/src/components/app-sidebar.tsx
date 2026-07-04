"use client"

import * as React from "react"
import { useUiStore, type WorkspaceTab } from "@/store/uiStore"
import { useAuth } from "@/components/useAuth"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Workflow,
  BarChart3,
  GitBranch,
  Settings2,
  LifeBuoy,
  MessageCircleCode,
} from "lucide-react"

type TabId = WorkspaceTab;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const backToAutomationList = useUiStore((s) => s.backToAutomationList);
  const { user } = useAuth();

  const userData = user
    ? {
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || "",
      }
    : {
        name: "User",
        email: "",
        avatar: "",
      };

  const navMain = [
    {
      title: "Automation",
      url: "#",
      icon: <Workflow />,
      isActive: true,
      activeTab: "automation" as TabId,
      items: [
        { title: "All Automations", url: "#", onClick: () => { setActiveTab("automation"); backToAutomationList(); } },
        { title: "Templates", url: "#", onClick: () => { setActiveTab("automation"); backToAutomationList(); } },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: <BarChart3 />,
      activeTab: "analytics" as TabId,
      items: [
        { title: "Overview", url: "#", onClick: () => setActiveTab("analytics") },
        { title: "Reports", url: "#", onClick: () => setActiveTab("analytics") },
      ],
    },
    {
      title: "Rules",
      url: "#",
      icon: <GitBranch />,
      activeTab: "rules" as TabId,
      items: [
        { title: "All Rules", url: "#", onClick: () => setActiveTab("rules") },
        { title: "Triggers", url: "#", onClick: () => setActiveTab("rules") },
      ],
    },
  ];

  const navSecondary = [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2 />,
      activeTab: "settings" as TabId,
    },
    {
      title: "Help",
      url: "#",
      icon: <LifeBuoy />,
    },
  ];

  const handleNavClick = (tabId?: string) => {
    if (tabId) setActiveTab(tabId as TabId);
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <MessageCircleCode className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Zatly</span>
                <span className="truncate text-xs">Messaging Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} onItemClick={handleNavClick} activeTab={activeTab} />
        <NavSecondary items={navSecondary} onItemClick={handleNavClick} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
