"use client";

import { Loader2, Save } from "lucide-react";
import type { useTranslations } from "next-intl";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface EditMemberValues {
  fullName?: string;
  phone?: string;
  roleId: string;
  branchId?: string;
}

const editMemberSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
  branchId: z.string().optional(),
});

function valueOrEmpty(val: string | null | undefined): string {
  return val ?? "";
}

interface EditMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    fullName: string | null;
    phone: string | null;
    roleId: string | null;
    branchId: string | null;
  };
  roles: Role[];
  branches: Pick<Branch, "id" | "name">[];
  onSave: (
    memberId: string,
    data: {
      fullName?: string;
      phone?: string;
      roleId: string;
      branchId?: string;
    },
  ) => Promise<void>;
  saving: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function EditMemberSheet({
  open,
  onOpenChange,
  member,
  roles,
  branches,
  onSave,
  saving,
  t,
}: EditMemberSheetProps) {
  const form = useForm<EditMemberValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      fullName: member.fullName ?? "",
      phone: member.phone ?? "",
      roleId: member.roleId ?? "",
      branchId: member.branchId ?? "",
    },
  });

  // Reset form when member changes
  const { reset } = form;
  const _memberId = member.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    reset({
      fullName: valueOrEmpty(member.fullName),
      phone: valueOrEmpty(member.phone),
      roleId: valueOrEmpty(member.roleId),
      branchId: valueOrEmpty(member.branchId),
    });
  }, [member.fullName, member.phone, member.roleId, member.branchId, reset]);

  const handleSubmitForm = form.handleSubmit(async (data) => {
    await onSave(member.id, {
      fullName: data.fullName?.trim() || "",
      phone: data.phone?.trim() || "",
      roleId: data.roleId,
      branchId: valueOrEmpty(data.branchId),
    });
  });

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("editTitle")}</DetailDrawer.Title>
        <DetailDrawer.Description>
          {t("editDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <form
          id="edit-member-form"
          onSubmit={handleSubmitForm}
          className="flex flex-col gap-5"
        >
          {/* ── Full Name ──────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.fullName}>
            <FieldLabel htmlFor="edit-name">{t("nameLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="edit-name"
                placeholder={t("namePlaceholder")}
                aria-invalid={!!form.formState.errors.fullName}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <FieldError>
                  {form.formState.errors.fullName.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Phone ──────────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.phone}>
            <FieldLabel htmlFor="edit-phone">{t("phoneLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="edit-phone"
                type="tel"
                placeholder={t("phonePlaceholder")}
                aria-invalid={!!form.formState.errors.phone}
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <FieldError>{form.formState.errors.phone.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Role ───────────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.roleId}>
            <FieldLabel>{t("roleLabel")}</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("roleId")}
                onValueChange={(val) => {
                  if (val) form.setValue("roleId", val);
                }}
              >
                <SelectTrigger className="w-full">
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
              {form.formState.errors.roleId && (
                <FieldError>{form.formState.errors.roleId.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Branch ─────────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.branchId}>
            <FieldLabel>{t("branchLabel")}</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("branchId")}
                onValueChange={(val) => {
                  form.setValue(
                    "branchId",
                    val === "__none__" ? "" : (val ?? ""),
                  );
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("noBranch")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("noBranch")}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.branchId && (
                <FieldError>
                  {form.formState.errors.branchId.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>
        </form>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            form="edit-member-form"
            type="submit"
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {t("save")}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
