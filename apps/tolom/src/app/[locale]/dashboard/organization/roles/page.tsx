"use client";

import { Eye, Shield, ShieldCheck, ShieldHalf, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { createOrgQuery } from "@/lib/queries/factory";
import { useCurrentOrg } from "@/lib/queries/use-organization";

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

const fetchRoles = createOrgQuery<Role[]>("/roles");

export default function RolesPage() {
  const t = useTranslations("organization.roles");
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? "";
  const { data: roles = [], isLoading: loading } = useQuery({
    queryKey: ["organizations", orgId, "roles"],
    queryFn: () => fetchRoles(orgId),
    enabled: !!orgId,
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </Typography.H1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Typography.H1 className="text-2xl font-semibold tracking-tight">
        {t("title")}
      </Typography.H1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = roleIcons[role.name] ?? Shield;
          const colorClass = roleColors[role.name] ?? "";

          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg border ${colorClass}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {role.description ?? "\u2014"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">
                    {t("memberCount", { count: role.memberCount })}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
