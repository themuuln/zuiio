"use client";

import { Eye, Shield, ShieldCheck, ShieldHalf, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useProfile } from "@/lib/queries/use-profile";
import type { ApiResponse } from "@/lib/types";

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  memberCount: number;
}

const roleIcons: Record<string, typeof Shield> = {
  "Org Owner": ShieldCheck,
  Manager: ShieldHalf,
  Mechanic: Wrench,
  Guest: Eye,
};

const roleColors: Record<string, string> = {
  "Org Owner":
    "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
  Manager:
    "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50",
  Mechanic:
    "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
  Guest:
    "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50",
};

export default function RolesPage() {
  const t = useTranslations("organization.roles");
  const { data: profile } = useProfile();
  const orgId = profile?.organizationId ?? "";

  const { data: roles = [], isLoading: loading } = useQuery<Role[]>({
    queryKey: ["organizations", orgId, "roles-with-counts"],
    queryFn: async () => {
      const [rolesRes, usersRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/roles`),
        fetch(`/api/organizations/${orgId}/users`),
      ]);

      const rolesBody = (await rolesRes.json()) as ApiResponse<Role[]>;
      const usersBody = (await usersRes.json()) as ApiResponse<
        { roleName: string | null }[]
      >;

      if (!rolesBody.data) return [];

      const roleCounts: Record<string, number> = {};
      if (usersBody.data) {
        for (const u of usersBody.data) {
          const rn = u.roleName ?? "Unassigned";
          roleCounts[rn] = (roleCounts[rn] ?? 0) + 1;
        }
      }

      return rolesBody.data.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        is_system: (r as unknown as Record<string, unknown>).is_system === true,
        memberCount: roleCounts[r.name] ?? 0,
      }));
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`skeleton-${i}`}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </Typography.H1>
        <Typography.Muted className="text-muted-foreground">
          {t("subtitle")}
        </Typography.Muted>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Shield className="size-10 text-muted-foreground/40 mb-3" />
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("noRoles")}
            </Typography.Muted>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const Icon = roleIcons[role.name] ?? Shield;
            const colorClass = roleColors[role.name] ?? "bg-card";

            return (
              <Card
                key={role.id}
                className={`border ${colorClass} transition-colors`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4" />
                    {role.name}
                    {role.is_system && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-[10px] uppercase tracking-wider"
                      >
                        {t("system")}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Typography.Muted className="text-sm text-muted-foreground">
                    {role.description || t("noDescription")}
                  </Typography.Muted>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium tabular-nums">
                      {role.memberCount}
                    </span>
                    <span>
                      {role.memberCount === 1 ? t("member") : t("members")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
