"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { NewMechanicSheet } from "@/components/new-mechanic-sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { mechanicKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useProfile } from "@/lib/queries/use-profile";

const MECHANIC_STORAGE_KEY = "tolom_active_mechanic";

export function MechanicSwitcher() {
  const { isMobile } = useSidebar();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;

  const { data: profile } = useProfile();
  const [activeMechanicId, setActiveMechanicId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(MECHANIC_STORAGE_KEY);
    if (stored) {
      setActiveMechanicId(stored);
      return;
    }
    if (profile?.id) {
      setActiveMechanicId(profile.id);
    }
  }, [profile?.id]);

  const { data: mechanics = [] } = useQuery({
    queryKey: mechanicKeys.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=mechanics`,
      );
      const json = await res.json();
      return (json.data ?? []) as { id: string; full_name: string }[];
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const activeMechanic =
    mechanics.find((m) => m.id === activeMechanicId) ?? null;
  const displayName =
    activeMechanic?.full_name ?? profile?.fullName ?? "Mechanic";

  const queryClient = useQueryClient();
  const [showAddMechanic, setShowAddMechanic] = useState(false);

  const handleSwitch = useCallback(
    (mechanicId: string | null) => {
      const id = mechanicId ?? profile?.id ?? "";
      setActiveMechanicId(id);
      localStorage.setItem(MECHANIC_STORAGE_KEY, id);
    },
    [profile],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="sm"
              className="h-7 px-1 aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
            />
          }
        >
          <Avatar className="size-4.5 shrink-0">
            <AvatarFallback className="text-[8px] font-medium bg-sidebar-accent text-sidebar-accent-foreground">
              <Wrench className="size-2.5" />
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate text-xs font-medium">{displayName}</span>
            <span className="truncate text-[9px] text-sidebar-foreground/50">
              {mechanics.length > 0
                ? `${mechanics.length} mechanics`
                : "No mechanics"}
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-48 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            Switch Mechanic
          </div>
          {mechanics.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-2 py-3">
              <span className="text-xs text-muted-foreground/50">
                No mechanics found
              </span>
              <button
                onClick={() => setShowAddMechanic(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <UserPlus className="size-3" />
                Invite mechanic
              </button>
            </div>
          )}
          {mechanics.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() => handleSwitch(m.id)}
              className="p-0"
            >
              <Item size="xs" className="border-0 w-full">
                <ItemMedia variant="image">
                  <MechanicAvatar mechanic={m} className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="text-xs">
                    {m.full_name ?? "Unknown"}
                  </ItemTitle>
                </ItemContent>
                {m.id === activeMechanicId && (
                  <ItemActions>
                    <span className="text-[10px] text-primary font-medium">
                      Active
                    </span>
                  </ItemActions>
                )}
              </Item>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <NewMechanicSheet
        open={showAddMechanic}
        onOpenChange={(open) => {
          setShowAddMechanic(open);
          if (!open) {
            queryClient.invalidateQueries({
              queryKey: mechanicKeys.list(orgId ?? ""),
            });
          }
        }}
      />
    </>
  );
}
