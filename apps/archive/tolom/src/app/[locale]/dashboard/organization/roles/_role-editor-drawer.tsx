"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import type { ManagedRole, PermissionRecord } from "@/lib/types";
import { PermissionGrid } from "./_permission-grid";

interface RoleEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing role to edit, or null for create mode */
  role: ManagedRole | null;
  permissions: PermissionRecord[];
  onSubmit: (data: {
    name: string;
    description: string | null;
    permissionIds: string[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
  deleting?: boolean;
}

const roleSchema = z.object({
  name: z.string().min(1, "nameRequired").max(60, "nameTooLong"),
  description: z.string().max(240).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export function RoleEditorDrawer({
  open,
  onOpenChange,
  role,
  permissions,
  onSubmit,
  onDelete,
  saving,
  deleting = false,
}: RoleEditorDrawerProps) {
  const t = useTranslations("organization.roles") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const isEditMode = role !== null;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when role changes
  const { reset } = form;
  useEffect(() => {
    if (open) {
      reset({
        name: role?.name ?? "",
        description: role?.description ?? "",
      });
      setSelectedIds(new Set(role?.permissions.map((p) => p.id) ?? []));
    }
  }, [open, role, reset]);

  // Permission selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleGroup = useCallback(
    (resource: string) => {
      const groupIds = permissions
        .filter((p) => p.resource === resource)
        .map((p) => p.id);
      const allSelected = groupIds.every((id) => selectedIds.has(id));

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of groupIds) {
          if (allSelected) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }
        return next;
      });
    },
    [permissions, selectedIds],
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      permissionIds: Array.from(selectedIds),
    });
  });

  const showDelete = isEditMode && !role.is_system && onDelete;

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          {isEditMode ? t("editTitle") : t("createTitle")}
        </DetailDrawer.Title>
        <DetailDrawer.Description>
          {isEditMode ? t("editDescription") : t("createDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <form
          id="role-editor-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          {/* ── Role Name ── */}
          <Field data-invalid={!!form.formState.errors.name}>
            <FieldLabel htmlFor="role-name">{t("roleName")}</FieldLabel>
            <FieldContent>
              <Input
                id="role-name"
                placeholder={t("roleNamePlaceholder")}
                aria-invalid={!!form.formState.errors.name}
                disabled={role?.is_system}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <FieldError>
                  {t(form.formState.errors.name.message as string)}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Description ── */}
          <Field>
            <FieldLabel htmlFor="role-description">
              {t("roleDescription")}
            </FieldLabel>
            <FieldContent>
              <Input
                id="role-description"
                placeholder={t("roleDescriptionPlaceholder")}
                disabled={role?.is_system}
                {...form.register("description")}
              />
            </FieldContent>
          </Field>

          {/* ── Permissions ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{t("permissionsTitle")}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("permissionsDescription")}
                </p>
              </div>
              {!role?.is_system && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedIds(new Set(permissions.map((p) => p.id)));
                    }}
                  >
                    {t("selectAll")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    {t("deselectAll")}
                  </Button>
                </div>
              )}
            </div>

            <PermissionGrid
              permissions={permissions}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onToggleGroup={handleToggleGroup}
              disabled={role?.is_system}
            />
          </div>
        </form>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <div>
            {showDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deleting || role.member_count > 0}
                title={
                  role.member_count > 0
                    ? t("deleteDisabled", { count: role.member_count })
                    : undefined
                }
                onClick={() => onDelete?.()}
              >
                {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            {!role?.is_system && (
              <Button type="submit" form="role-editor-form" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("save")}
              </Button>
            )}
          </div>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
