"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { PermissionRecord } from "@/lib/types";

interface PermissionGroup {
  resource: string;
  permissions: PermissionRecord[];
}

interface PermissionGridProps {
  permissions: PermissionRecord[];
  selectedIds: Set<string>;
  onToggle: (permissionId: string) => void;
  onToggleGroup: (resource: string) => void;
  disabled?: boolean;
}

export function PermissionGrid({
  permissions,
  selectedIds,
  onToggle,
  onToggleGroup,
  disabled = false,
}: PermissionGridProps) {
  const groups = useMemo((): PermissionGroup[] => {
    const groupMap = new Map<string, PermissionRecord[]>();
    for (const p of permissions) {
      const existing = groupMap.get(p.resource) ?? [];
      existing.push(p);
      groupMap.set(p.resource, existing);
    }
    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, perms]) => ({
        resource,
        permissions: perms.sort((a, b) => a.action.localeCompare(b.action)),
      }));
  }, [permissions]);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const groupIds = group.permissions.map((p) => p.id);
        const selectedInGroup = groupIds.filter((id) => selectedIds.has(id));
        const allSelected =
          groupIds.length > 0 && selectedInGroup.length === groupIds.length;

        return (
          <div
            key={group.resource}
            className="rounded-lg border border-border/60 bg-card/40"
          >
            {/* Group header */}
            <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => onToggleGroup(group.resource)}
                  disabled={disabled}
                />
                <span className="text-sm font-medium capitalize">
                  {group.resource.replace(/_/g, " ")}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedInGroup.length}/{groupIds.length}
              </Badge>
            </div>

            {/* Individual permissions */}
            <div className="grid gap-0 sm:grid-cols-2">
              {group.permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/30"
                >
                  <Checkbox
                    checked={selectedIds.has(perm.id)}
                    onCheckedChange={() => onToggle(perm.id)}
                    disabled={disabled}
                  />
                  <span className="text-muted-foreground">
                    {perm.description ?? perm.action}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
