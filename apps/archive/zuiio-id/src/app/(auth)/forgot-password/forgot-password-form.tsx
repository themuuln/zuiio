"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPassword,
    undefined,
  );

  if (state?.success) {
    return (
      <div className="flex animate-fade-in flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Имэйл илгээгдлээ
          </h1>
          <p className="text-sm text-muted-foreground">
            Нууц үг сэргээх холбоосыг таны имэйл хаягт илгээлээ. Шалгана уу.
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Нууц үг мартсан
        </h1>
        <p className="text-sm text-muted-foreground">
          Имэйл хаягаа оруулбал нууц үг сэргээх холбоос илгээх болно.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Имэйл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            placeholder="name@example.com"
          />
        </div>

        {state?.formError && (
          <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="active-scale h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Илгээж байна…" : "Нууц үг сэргээх"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Буцах{" "}
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
        >
          нэвтрэх хуудас руу
        </Link>
      </p>
    </div>
  );
}
