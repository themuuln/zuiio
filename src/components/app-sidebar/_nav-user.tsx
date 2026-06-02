"use client";

import { SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { getInitials } from "@/lib/utils";

export function NavUser() {
  const t = useTranslations("userMenu");
  const [profile, setProfile] = useState<{
    fullName?: string | null;
    username?: string | null;
    email?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.fullName ?? t("user");
  const displayIdentifier = profile?.username ?? "";
  const initials = getInitials(profile?.fullName);

  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="relative size-9 rounded-full flex items-center justify-center p-0 hover:bg-accent/50 focus-visible:ring-2"
            aria-label={t("menu")}
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                {loading ? "…" : initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
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
                  {loading ? "…" : initials}
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
            <SettingsIcon />
            <span>{t("settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive gap-2 text-xs"
          >
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
