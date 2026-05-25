"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization } from "@/lib/types";

export function OrgBranding() {
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
  const name = org?.name ?? "TOLOM";

  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border/60 group-data-[collapsible=icon]:bg-sidebar-accent/20 group-data-[collapsible=icon]:self-center"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/95 text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/20">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={name}
              width={22}
              height={22}
              className="size-5.5 rounded-xl object-contain"
            />
          ) : (
            <span className="text-sm font-bold tracking-tight">T</span>
          )}
        </div>
        <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
            Workspace
          </span>
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="truncate text-[10px] text-sidebar-foreground/55">
            {org?.name ? "Operations hub" : "Loading..."}
          </span>
        </div>
      </Link>
    </div>
  );
}
