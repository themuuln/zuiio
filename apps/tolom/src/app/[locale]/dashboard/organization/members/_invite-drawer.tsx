"use client";

import { Loader2, MailPlus } from "lucide-react";
import type { useTranslations } from "next-intl";
import React from "react";
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
import { inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

interface Role {
  id: string;
  name: string;
}

const inviteFormSchema = z.object({
  email: z.string().email("Valid email is required"),
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
  t: ReturnType<typeof useTranslations<"organization.memberManagement">>;
}

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
      email: "",
      roleId: defaultRoleId,
    },
  });

  // Reset form only when sheet first opens (not when defaultRoleId changes async)
  const { reset } = form;
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (open && !prevOpen.current) {
      reset({
        email: "",
        roleId: defaultRoleId,
      });
    }
    prevOpen.current = open;
  }, [open, defaultRoleId, reset]);

  function handleSubmit(data: InviteFormValues) {
    onSubmit({
      email: data.email.trim(),
      roleId: data.roleId,
    });
  }

  const handleFormSubmit = form.handleSubmit(handleSubmit);

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="md">
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("inviteNew")}</DetailDrawer.Title>
        <DetailDrawer.Description>
          {t("inviteDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <form
          id="invite-form"
          onSubmit={handleFormSubmit}
          className="flex flex-col gap-5"
        >
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="invite-email">{t("emailLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="invite-email"
                type="email"
                placeholder={t("emailPlaceholder")}
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
                {...inputProps("email")}
              />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
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
        </form>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t("cancel")}
        </Button>
        <Button form="invite-form" type="submit" disabled={sending}>
          {sending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <MailPlus className="mr-2 size-4" />
          )}
          {t("sendInvite")}
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
