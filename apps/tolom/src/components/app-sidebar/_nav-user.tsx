"use client";

import { ChevronsUpDown, LogOut, SettingsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useProfile } from "@/lib/queries/use-profile";
import { getInitials } from "@/lib/utils";

export function NavUser() {
  const t = useTranslations("userMenu");
  const { data: profile } = useProfile();

  const displayName = profile?.fullName ?? t("user");
  const displayIdentifier = profile?.username ?? "";
  const initials = getInitials(profile?.fullName ?? null);

  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          />
        }
      >
        <Avatar className="size-7 shrink-0 rounded-md">
          <AvatarFallback className="text-[10px] font-semibold rounded-md bg-primary/10 text-primary">
            {!profile ? "…" : initials}
          </AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{displayName}</span>
          <span className="truncate text-xs text-sidebar-foreground/50">
            {displayIdentifier}
          </span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/40" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-xl"
        align="end"
        sideOffset={6}
      >
        <DropdownMenuGroup>
          <Item size="sm" className="border-0 px-1.5 py-2">
            <ItemMedia variant="image">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {!profile ? "…" : initials}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-sm">{displayName}</ItemTitle>
              {displayIdentifier && (
                <ItemDescription className="text-[11px]">
                  @{displayIdentifier}
                </ItemDescription>
              )}
            </ItemContent>
          </Item>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="gap-2 text-xs"
          >
            <SettingsIcon className="size-4" />
            <span>{t("settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="gap-2 text-xs text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
