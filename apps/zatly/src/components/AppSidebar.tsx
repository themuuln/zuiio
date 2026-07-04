"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUiStore, type WorkspaceTab } from "@/store/uiStore";
import {
  Workflow,
  Settings,
  BarChart3,
  GitBranch,
} from "lucide-react";

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "automation", label: "Automation", icon: Workflow },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "rules", label: "Rules", icon: GitBranch },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="items-center py-3">
        <div className="flex size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-primary-foreground">
          <span className="text-sm font-bold">ZB</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    tooltip={item.label}
                    size="sm"
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
