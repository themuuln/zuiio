"use client";

import { ArrowRight, Envelope, Lock, User } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { register } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <Card className="w-full max-w-sm border-border/70 bg-background/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Бүртгүүлэх</CardTitle>
        <CardDescription>Шинэ бүртгэл үүсгэх</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="full_name">Нэр</FieldLabel>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Батболд"
                  required
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
                  minLength={8}
                  className="pl-9"
                />
              </div>
            </Field>
          </FieldGroup>

          {state?.error ? (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}

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
      </CardContent>
    </Card>
  );
}
