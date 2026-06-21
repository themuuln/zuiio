"use client";

import { ArrowRight, Envelope, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "./actions";

const DEV_EMAIL = "themuuln1@gmail.com";
const DEV_PASSWORD = "Tolom!11";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <AuthCard title="Нэвтрэх" description="Имэйл хаяг, нууц үгээ оруулна уу">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Имэйл</FieldLabel>
            <div className="relative">
              <Envelope className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                className="pl-9"
                defaultValue={isDev ? DEV_EMAIL : undefined}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Нууц үг</FieldLabel>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="pl-9"
                defaultValue={isDev ? DEV_PASSWORD : undefined}
              />
            </div>
          </Field>
        </FieldGroup>

        <ErrorBanner error={state?.error} />

        <Button type="submit" disabled={pending}>
          Нэвтрэх
          <ArrowRight data-icon="inline-end" />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Бүртгэлгүй юу?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Бүртгүүлэх
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
