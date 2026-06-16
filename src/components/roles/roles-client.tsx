"use client";

import { Plus, Trash, Users } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRole } from "@/app/(dashboard)/settings/roles/actions";
import { PermissionEditor } from "@/components/roles/permission-editor";
import { RoleForm } from "@/components/roles/role-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import type { AppPermission } from "@/lib/permissions";

interface Role {
  id: string;
  name: string;
  description: string | null;
  hierarchy_level: number;
  is_system_role: boolean;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission: AppPermission;
}

interface RolesClientProps {
  roles: Role[];
  rolePermissions: RolePermission[];
}

export function RolesClient({ roles, rolePermissions }: RolesClientProps) {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const selectedPermissions = rolePermissions
    .filter((rp) => rp.role_id === selectedRoleId)
    .map((rp) => rp.permission);
  const selectedPermissionSet = new Set(selectedPermissions);

  const rolesByLevel = [...roles].sort(
    (a, b) => a.hierarchy_level - b.hierarchy_level,
  );

  const handleDelete = async (roleId: string) => {
    setDeleting(roleId);
    const result = await deleteRole(roleId);
    setDeleting(null);
    if (result?.error) {
      alert(result.error);
    }
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      {/* Left: role list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Үүргүүд</CardTitle>
            <CardDescription>{roles.length} үүрэг</CardDescription>
          </div>
          <SlideInDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
            title="Шинэ үүрэг"
            panelWidth="24rem"
            trigger={
              <Button size="sm" variant="default">
                <Plus className="size-4" />
                Шинэ
              </Button>
            }
          >
            <RoleForm onSuccess={() => setCreateOpen(false)} />
          </SlideInDrawer>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {rolesByLevel.map((role) => {
              const permCount = rolePermissions.filter(
                (rp) => rp.role_id === role.id,
              ).length;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-accent/50 ${
                    selectedRoleId === role.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{role.name}</span>
                        {role.is_system_role && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] leading-relaxed"
                          >
                            Систем
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {permCount} эрх
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right: permission editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedRole ? (
                  <span className="capitalize">{selectedRole.name}</span>
                ) : (
                  "Үүрэг сонгоно уу"
                )}
              </CardTitle>
              {selectedRole?.description && (
                <CardDescription>{selectedRole.description}</CardDescription>
              )}
            </div>
            {selectedRole && (
              <div className="flex items-center gap-2">
                {selectedRole.is_system_role && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] leading-relaxed"
                  >
                    Системийн үүрэг
                  </Badge>
                )}
                {!selectedRole.is_system_role && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(selectedRole.id)}
                    disabled={deleting === selectedRole.id}
                  >
                    <Trash className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedRole ? (
            <PermissionEditor
              key={selectedRole.id}
              roleId={selectedRole.id}
              selectedPermissions={selectedPermissionSet}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Users className="mb-2 size-8" />
              <p className="text-sm">
                Зүүн талаас үүрэг сонгон эрхүүдийг тохируулна уу
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
