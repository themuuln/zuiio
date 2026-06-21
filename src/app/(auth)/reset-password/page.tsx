"use client";

import { Lock, Password } from "@phosphor-icons/react";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updatePassword } from "./actions";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <AuthCard
      title="Шинэ нууц үг"
      description="Аюулгүй шинэ нууц үгээ оруулаад бүртгэлдээ буцаж нэвтэрнэ үү."
    >
      <form action={action} className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">Шинэ нууц үг</FieldLabel>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="pl-9"
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm_password">Давтан оруулах</FieldLabel>
            <div className="relative">
              <Password className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                className="pl-9"
              />
            </div>
          </Field>
        </FieldGroup>

        <ErrorBanner error={state?.error} />

        <Button type="submit" disabled={pending}>
          Нууц үг шинэчлэх
        </Button>
      </form>
    </AuthCard>
  );
}
