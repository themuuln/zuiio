"use client";

import { Loader2, MailPlus, X } from "lucide-react";
import type { useTranslations } from "next-intl";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm, zodResolver } from "@/lib/hooks/use-form";

interface Role {
  id: string;
  name: string;
}

// ── Zod Schema ──────────────────────────────────────────────

const inviteFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  roleId: z.string().min(1, "Please select a role"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface InviteFormProps {
  sending: boolean;
  onSubmit: (data: { email: string; roleId: string }) => void;
  onClose: () => void;
  roles: Role[];
  defaultRoleId: string;
  t: ReturnType<typeof useTranslations<"organization.members">>;
}

export function InviteForm({
  sending,
  onSubmit,
  onClose,
  roles,
  defaultRoleId,
  t,
}: InviteFormProps) {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      roleId: defaultRoleId,
    },
  });

  function handleSubmit(data: InviteFormValues) {
    onSubmit({
      email: data.email.trim(),
      roleId: data.roleId,
    });
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between gap-y-0 pb-3">
        <CardTitle className="text-base">{t("inviteNew")}</CardTitle>
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-8"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex items-end gap-3"
        >
          <Field
            data-invalid={!!form.formState.errors.email}
            className="flex-1"
          >
            <FieldLabel htmlFor="inviteEmail">{t("emailLabel")}</FieldLabel>
            <FieldContent>
              <Input
                id="inviteEmail"
                type="email"
                placeholder={t("emailPlaceholder")}
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field
            data-invalid={!!form.formState.errors.roleId}
            className="flex-1"
          >
            <FieldLabel htmlFor="inviteRole">{t("roleLabel")}</FieldLabel>
            <FieldContent>
              <select
                id="inviteRole"
                value={form.watch("roleId")}
                onChange={(e) => form.setValue("roleId", e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-invalid={!!form.formState.errors.roleId}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.roleId && (
                <FieldError>{form.formState.errors.roleId.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Button type="submit" disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <MailPlus className="mr-2 size-4" />
            )}
            {t("sendInvite")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
