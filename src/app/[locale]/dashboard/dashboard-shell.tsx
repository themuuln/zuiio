"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BrandThemeProvider from "@/components/brand-theme-provider";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsTablet } from "@/hooks/use-mobile";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();
  const isTablet = useIsTablet();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const match = document.cookie.match(/(^| )sidebar_state=([^;]+)/);
    if (match) {
      setSidebarOpen(match[2] === "true");
    }
  }, []);

  useEffect(() => {
    if (isTablet !== undefined) {
      setSidebarOpen(!isTablet);
    }
  }, [isTablet]);

  const wrapped = (
    <BrandThemeProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        defaultOpen={true}
      >
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="font-semibold">TOLOM</span>
          </header>
          <div className="flex-1 overflow-y-auto p-3 tablet:p-4 lg:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BrandThemeProvider>
  );

  if (!orgInfo) return wrapped;

  return (
    <SubscriptionGuard
      orgId={orgInfo.orgId}
      orgName={orgInfo.orgName ?? "Organization"}
    >
      {wrapped}
    </SubscriptionGuard>
  );
}
