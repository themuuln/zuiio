"use client";

import { MoreHorizontal, Shield, UserMinus, Users } from "lucide-react";
import type { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/lib/types";

interface Role {
  id: string;
  name: string;
}

interface MemberListProps {
  loading: boolean;
  members: UserProfile[];
  roles: Role[];
  onRoleChange: (userId: string, roleId: string) => void;
  onRemove: (userId: string) => void;
  t: ReturnType<typeof useTranslations<"organization.members">>;
}

export function MemberList({
  loading,
  members,
  roles,
  onRoleChange,
  onRemove,
  t,
}: MemberListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4" />
          {t("members")}
        </CardTitle>
        <CardDescription>{t("membersDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noMembers")}
          </p>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase text-muted-foreground">
                    {(member.fullName ?? member.email ?? "?").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {member.fullName ?? t("unnamed")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.roleName ?? t("noRole")}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Shield className="mr-2 size-4" />
                        {t("changeRole")}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {roles.map((role) => (
                          <DropdownMenuItem
                            key={role.id}
                            onClick={() => onRoleChange(member.id, role.id)}
                          >
                            {role.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onRemove(member.id)}
                    >
                      <UserMinus className="mr-2 size-4" />
                      {t("removeMember")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
