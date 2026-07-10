"use client";

import { ArrowRight, Envelope, Lock, User } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { register } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <AuthCard title="Бүртгүүлэх" description="Шинэ бүртгэл үүсгэх">
      <form action={action} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="full_name">Нэр</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Нэрээ оруулна уу"
                required
                autoComplete="name"
                className="pl-9"
              />
            </div>
          </Field>
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
                autoComplete="email"
                className="pl-9"
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
                autoComplete="new-password"
                className="pl-9"
              />
            </div>
          </Field>
        </FieldGroup>

        <ErrorBanner error={state?.error} />

        {state && "success" in state && state.success ? (
          <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            {state.success}
          </div>
        ) : null}

        <Button type="submit" disabled={pending}>
          Бүртгүүлэх
          <ArrowRight data-icon="inline-end" />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Бүртгэлтэй юу?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Нэвтрэх
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
