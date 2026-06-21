"use client";

import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  return (
    <AuthCard
      title="Нууц үг сэргээх"
      description="Бүртгэлтэй имэйл хаягаа оруулбал нууц үг сэргээх холбоос илгээнэ."
    >
      <form action={action} className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Имэйл</FieldLabel>
            <div className="relative">
              <EnvelopeSimple className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="pl-9"
              />
            </div>
          </Field>
        </FieldGroup>

        <ErrorBanner error={state?.error} />

        {state?.success ? (
          <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {state.success}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={pending}>
            Холбоос илгээх
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">
              <ArrowLeft data-icon="inline-start" />
              Нэвтрэх рүү буцах
            </Link>
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
