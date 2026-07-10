"use client";

import {
  Eye,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  ShieldHalf,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useUpdateRole,
} from "@/lib/queries/use-roles";
import type { ManagedRole } from "@/lib/types";
import { RoleEditorDrawer } from "./_role-editor-drawer";

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
    "bg-green-50 dark:bg-green-950/20 border-green-900/20 dark:border-green-900/50",
};

export default function RolesPage() {
  const t = useTranslations("organization.roles");
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId ?? "";

  const { data: roles = [], isPending: loading } = useRoles(orgId);
  const { data: permissions = [] } = usePermissions(orgId);

  const createMutation = useCreateRole(orgId);
  const updateMutation = useUpdateRole(orgId);
  const deleteMutation = useDeleteRole(orgId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ManagedRole | null>(null);

  const handleAdd = useCallback(() => {
    setEditingRole(null);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((role: ManagedRole) => {
    setEditingRole(role);
    setDrawerOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (data: {
      name: string;
      description: string | null;
      permissionIds: string[];
    }) => {
      try {
        if (editingRole) {
          await updateMutation.mutateAsync({
            roleId: editingRole.id,
            ...data,
          });
          toast.success(t("updated"));
        } else {
          await createMutation.mutateAsync(data);
          toast.success(t("created"));
        }
        setDrawerOpen(false);
        setEditingRole(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("failedToCreate");
        toast.error(message);
      }
    },
    [editingRole, createMutation, updateMutation, t],
  );

  const handleDelete = useCallback(async () => {
    if (!editingRole) return;
    try {
      await deleteMutation.mutateAsync({ roleId: editingRole.id });
      toast.success(t("deleted"));
      setDrawerOpen(false);
      setEditingRole(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("failedToDelete");
      toast.error(message);
    }
  }, [editingRole, deleteMutation, t]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </Typography.H1>
        </div>
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
      <div className="flex items-center justify-between">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </Typography.H1>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 size-4" />
          {t("addRole")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = roleIcons[role.name] ?? Shield;
          const colorClass = roleColors[role.name] ?? "";

          return (
            <Card
              key={role.id}
              className="group cursor-pointer transition-colors hover:border-foreground/20"
              onClick={() => handleEdit(role)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
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
                  {!role.is_system && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(role);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">
                    {role.member_count}{" "}
                    {role.member_count === 1 ? t("member") : t("members")}
                  </Badge>
                  <Badge variant="outline">
                    {role.permissions.length}{" "}
                    {role.permissions.length === 1
                      ? t("permission")
                      : t("permissions")}
                  </Badge>
                  {role.is_system && (
                    <Badge variant="secondary">{t("system")}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {roles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Shield className="mb-4 size-10" />
          <p>{t("noRoles")}</p>
        </div>
      )}

      <RoleEditorDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        role={editingRole}
        permissions={permissions}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        saving={createMutation.isPending || updateMutation.isPending}
        deleting={deleteMutation.isPending}
      />
    </div>
  );
}
