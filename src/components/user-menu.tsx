"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/lib/i18n/navigation";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

interface UserMenuProps {
  collapsed?: boolean;
}

export default function UserMenu({ collapsed }: UserMenuProps) {
  const t = useTranslations("userMenu");
  const { push, refresh } = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // Silently fail — user stays as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    push("/auth/login");
    refresh();
  };

  const displayName = profile?.fullName ?? "User";
  const displayIdentifier = profile?.username ?? "";
  const initials = getInitials(profile?.fullName);

  if (loading) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2",
          collapsed && "lg:w-auto lg:justify-center",
        )}
      >
        <Item size="sm" className="border-0 gap-3 p-2">
          <ItemMedia variant="image">
            <Avatar className="size-8">
              <AvatarFallback>…</AvatarFallback>
            </Avatar>
          </ItemMedia>
          {!collapsed && (
            <ItemContent className="gap-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-28" />
            </ItemContent>
          )}
        </Item>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors cursor-pointer",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && "lg:w-auto lg:justify-center",
        )}
      >
        <Item size="sm" className="border-0 gap-3 p-2">
          <ItemMedia variant="image">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          {!collapsed && (
            <ItemContent>
              <ItemTitle className="text-sm">{displayName}</ItemTitle>
              {displayIdentifier && (
                <ItemDescription className="text-xs text-sidebar-foreground/60">
                  @{displayIdentifier}
                </ItemDescription>
              )}
            </ItemContent>
          )}
        </Item>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuGroup>
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {t("signedInAs")}{" "}
            <span className="font-medium text-foreground">{displayName}</span>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="size-4" />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
