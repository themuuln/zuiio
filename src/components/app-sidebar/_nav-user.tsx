"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsIcon } from "lucide-react";
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
import { getInitials } from "@/lib/utils";

export function NavUser() {
  const [profile, setProfile] = useState<{
    fullName?: string | null;
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

  const displayName = profile?.fullName ?? "User";
  const email = profile?.email ?? "";
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
            aria-label="User menu"
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
          <div className="flex items-center gap-2 px-1.5 py-2 text-left text-sm">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {loading ? "…" : initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {email}
              </span>
            </div>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="gap-2 text-xs"
          >
            <SettingsIcon />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive gap-2 text-xs"
          >
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
