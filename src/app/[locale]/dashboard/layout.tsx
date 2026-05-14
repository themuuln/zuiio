"use client";

import type { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SubscriptionGuard } from "@/components/subscription-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  useRequireAuth();
  const { data: orgInfo } = useCurrentOrg();

  const wrapped = (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-semibold">TOLOM</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 tablet:p-5 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );

  if (!orgInfo) return wrapped;

  return (
    <SubscriptionGuard orgId={orgInfo.orgId} orgName={orgInfo.orgName ?? "Organization"}>
      {wrapped}
    </SubscriptionGuard>
  );
}
