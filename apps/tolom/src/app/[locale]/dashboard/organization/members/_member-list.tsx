"use client";

import { MoreHorizontal, Pencil, UserMinus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
  onRoleChange: (memberId: string, roleId: string) => void;
  onEdit: (member: UserProfile) => void;
  onRemove: (memberId: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
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
  if (loading && members.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
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
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
              >
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            {t("members")}
          </CardTitle>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
            {t("memberCount", { count: members.length })}
          </Badge>
        </div>
        <CardDescription>{t("membersDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 && !loading ? (
          <Empty className="border border-dashed border-border/70 bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{t("noMembers")}</EmptyTitle>
              <EmptyDescription>{t("noMembersDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-xs font-semibold uppercase text-muted-foreground">
                    {(
                      member.fullName ??
                      member.username ??
                      member.email ??
                      "?"
                    ).slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <Typography.Text className="block truncate text-sm font-medium">
                      {member.fullName ?? member.username ?? t("unnamed")}
                    </Typography.Text>
                    <Typography.Muted className="block truncate text-xs">
                      {member.phone ??
                        member.username ??
                        member.email ??
                        t("noContact")}
                    </Typography.Muted>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <Select
                    value={member.roleId ?? ""}
                    onValueChange={(val) => {
                      if (val) onRoleChange(member.id, val);
                    }}
                  >
                    <SelectTrigger className="h-9 min-w-[148px] rounded-lg">
                      <SelectValue placeholder={t("noRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-9 rounded-lg"
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
