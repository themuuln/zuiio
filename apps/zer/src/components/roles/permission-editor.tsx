"use client";

import { useState } from "react";
import { setRolePermissions } from "@/app/(dashboard)/settings/roles/actions";
import { Button } from "@/components/ui/button";
import type { AppPermission } from "@/lib/permissions";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permissions";
import { toast } from "sonner";

interface PermissionEditorProps {
  roleId: string;
  selectedPermissions: Set<string>;
}

export function PermissionEditor({
  roleId,
  selectedPermissions: initialPermissions,
}: PermissionEditorProps) {
  const [selectedPerms, setSelectedPerms] =
    useState<Set<string>>(initialPermissions);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    initialPermissions.size !== selectedPerms.size ||
    ![...initialPermissions].every((p) => selectedPerms.has(p));

  const togglePermission = (perm: AppPermission) => {
    const next = new Set(selectedPerms);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    setSelectedPerms(next);
  };

  const toggleGroup = (perms: AppPermission[]) => {
    const allSelected = perms.every((p) => selectedPerms.has(p));
    const next = new Set(selectedPerms);
    for (const perm of perms) {
      if (allSelected) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
    }
    setSelectedPerms(next);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await setRolePermissions(roleId, [
      ...selectedPerms,
    ] as AppPermission[]);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  const totalCount = PERMISSION_GROUPS.reduce(
    (acc, g) => acc + g.permissions.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedPerms.size} / {totalCount} эрх сонгогдсон
        </p>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? "Хадгалах..." : "Хадгалах"}
        </Button>
      </div>

      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => {
          const allSelected = group.permissions.every((p) =>
            selectedPerms.has(p),
          );
          const someSelected = group.permissions.some((p) =>
            selectedPerms.has(p),
          );

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.permissions)}
                className="mb-2 flex items-center gap-2 text-sm font-medium hover:text-primary"
              >
                <div
                  className={`size-4 rounded border ${
                    allSelected
                      ? "border-primary bg-primary"
                      : someSelected
                        ? "border-primary bg-primary/30"
                        : "border-input"
                  } flex items-center justify-center`}
                >
                  {allSelected && (
                    <svg
                      className="size-3 text-primary-foreground"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {someSelected && !allSelected && (
                    <div className="size-2 rounded-sm bg-primary" />
                  )}
                </div>
                {group.label}
              </button>
              <div className="ml-6 flex flex-wrap gap-2">
                {group.permissions.map((perm) => (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      selectedPerms.has(perm)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    {selectedPerms.has(perm) && (
                      <svg
                        className="size-3"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {PERMISSION_LABELS[perm]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
