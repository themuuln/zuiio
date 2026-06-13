"use client";

import { Loader2, Save } from "lucide-react";
import type { useTranslations } from "next-intl";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  fullName: string;
  phone: string;
  roleId: string;
  branchId: string;
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
  branches: Branch[];
  onSave: (memberId: string, data: EditMemberValues) => Promise<void>;
  saving: boolean;
  t: ReturnType<typeof useTranslations<"organization.memberManagement">>;
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("editTitle")}</SheetTitle>
          <SheetDescription>{t("editDescription")}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmitForm} className="flex flex-col gap-5 py-6">
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
                  form.setValue("branchId", val === "__none__" ? "" : val);
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

          <SheetFooter className="mt-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {t("save")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
