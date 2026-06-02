"use client";

import { MoreHorizontal, Pencil, UserMinus, Users } from "lucide-react";
import type { useTranslations } from "next-intl";
import { useMemo } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
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
  onEdit: (member: UserProfile) => void;
  onRemove: (userId: string) => void;
  t: ReturnType<typeof useTranslations<"organization.members">>;
}

export function MemberList({
  loading,
  members,
  roles,
  onRoleChange,
  onEdit,
  onRemove,
  t,
}: MemberListProps) {
  // Build a value→label map so @base-ui/react SelectValue resolves IDs to names
  const roleItems = useMemo(
    () =>
      roles.reduce(
        (acc, role) => ({ ...acc, [role.id]: role.name }),
        {} as Record<string, string>,
      ),
    [roles],
  );

  // ── Loading strategy ──────────────────────────────────────────────────
  // On initial load (no data yet) → show skeleton.
  // On refetch (data already exists) → keep list visible, no flash.
  // Only show empty state when loading is done and there's truly no data.
  // ───────────────────────────────────────────────────────────────────────

  if (loading && members.length === 0) {
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
        </CardContent>
      </Card>
    );
  }

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
        {members.length === 0 && !loading ? (
          <Typography.Muted className="py-4 text-center text-sm text-muted-foreground">
            {t("noMembers")}
          </Typography.Muted>
        ) : (
          <div className="divide-y">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase text-muted-foreground">
                    {(
                      member.fullName ??
                      member.username ??
                      member.email ??
                      "?"
                    ).slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex flex-col gap-1">
                      <Typography.Text className="text-sm font-medium">
                        {member.fullName ?? member.username ?? t("unnamed")}
                      </Typography.Text>
                      <Select
                        value={member.roleId ?? ""}
                        onValueChange={(val) => {
                          if (val) onRoleChange(member.id, val);
                        }}
                        items={roleItems}
                      >
                        <SelectTrigger className="h-7 min-w-[130px] text-xs px-2 py-0">
                          <SelectValue placeholder={t("noRole")} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id}
                              className="text-xs"
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-8"
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(member)}>
                      <Pencil className="mr-2 size-4" />
                      {t("editMember")}
                    </DropdownMenuItem>
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
