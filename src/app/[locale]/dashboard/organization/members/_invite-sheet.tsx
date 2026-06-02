"use client";

import { Loader2, MailPlus } from "lucide-react";
import React from "react";
import { useLocale } from "next-intl";
import type { useTranslations } from "next-intl";
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

const inviteFormSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  roleId: z.string().min(1, "Please select a role"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sending: boolean;
  onSubmit: (data: { email: string; roleId: string }) => void;
  roles: Role[];
  defaultRoleId: string;
  t: ReturnType<typeof useTranslations<"organization.members">>;
}

const identifierLabels: Record<string, string> = {
  en: "Email, Phone, or Username",
  mn: "И-мэйл, Утас, эсвэл Хэрэглэгчийн нэр",
};

const identifierPlaceholders: Record<string, string> = {
  en: "Enter email, phone, or username",
  mn: "И-мэйл, утас, эсвэл хэрэглэгчийн нэрээ оруулна уу",
};

export function InviteSheet({
  open,
  onOpenChange,
  sending,
  onSubmit,
  roles,
  defaultRoleId,
  t,
}: InviteSheetProps) {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      identifier: "",
      roleId: defaultRoleId,
    },
  });

  // Reset form when sheet opens
  const { reset } = form;
  React.useEffect(() => {
    if (open) {
      reset({
        identifier: "",
        roleId: defaultRoleId,
      });
    }
  }, [open, defaultRoleId, reset]);

  function handleSubmit(data: InviteFormValues) {
    onSubmit({
      email: data.identifier.trim(),
      roleId: data.roleId,
    });
  }

  const locale = useLocale();
  const identifierLabel = identifierLabels[locale] ?? identifierLabels.en;
  const identifierPlaceholder =
    identifierPlaceholders[locale] ?? identifierPlaceholders.en;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("inviteNew")}</SheetTitle>
          <SheetDescription>{t("emailPlaceholder")}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 py-6"
        >
          {/* ── Identifier (Email / Phone / Username) ────── */}
          <Field data-invalid={!!form.formState.errors.identifier}>
            <FieldLabel htmlFor="invite-identifier">
              {identifierLabel}
            </FieldLabel>
            <FieldContent>
              <Input
                id="invite-identifier"
                type="text"
                placeholder={identifierPlaceholder}
                aria-invalid={!!form.formState.errors.identifier}
                {...form.register("identifier")}
              />
              {form.formState.errors.identifier && (
                <FieldError>
                  {form.formState.errors.identifier.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* ── Role ───────────────────────────────────────── */}
          <Field data-invalid={!!form.formState.errors.roleId}>
            <FieldLabel>{t("roleLabel")}</FieldLabel>
            <FieldContent>
              <Select
                value={form.watch("roleId")}
                onValueChange={(val) => form.setValue("roleId", val ?? "")}
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

          <SheetFooter className="mt-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <MailPlus className="mr-2 size-4" />
              )}
              {t("sendInvite")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
