"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/(dashboard)/settings/roles/actions";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";

interface Member {
  id: string;
  full_name: string | null;
  role: string | null;
  role_id: string | null;
  email: string;
}

interface Role {
  id: string;
  name: string;
  is_system_role: boolean;
}

interface MembersClientProps {
  members: Member[];
  roles: Role[];
  currentUserId: string;
  canManageRole: boolean;
}

export function MembersClient({
  members,
  roles,
  currentUserId,
  canManageRole,
}: MembersClientProps) {
  const [changing, setChanging] = useState<string | null>(null);

  const handleRoleChange = async (profileId: string, roleId: string | null) => {
    setChanging(profileId);
    const result = await updateUserRole(profileId, roleId);
    setChanging(null);
    if (result?.error) {
      alert(result.error);
    }
  };

  return (
    <div className="divide-y">
      {members.map((member) => {
        const roleName =
          roles.find((r) => r.id === member.role_id)?.name ?? member.role;

        return (
          <div
            key={member.id}
            className={`flex items-center justify-between px-6 py-4 ${
              member.id === currentUserId ? "bg-accent/50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {member.full_name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {member.full_name ?? "Нэргүй"}
                  </span>
                  {member.id === currentUserId && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] leading-relaxed"
                    >
                      Та
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {member.email || "—"}
                </span>
              </div>
            </div>

            {canManageRole && member.id !== currentUserId ? (
              <NativeSelect
                value={member.role_id ?? ""}
                onChange={(e) =>
                  handleRoleChange(member.id, e.target.value || null)
                }
                disabled={changing === member.id}
                className="w-36"
              >
                <option value="">Үүрэг сонгох</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <Badge variant="outline">{roleName ?? "Гишүүн"}</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
