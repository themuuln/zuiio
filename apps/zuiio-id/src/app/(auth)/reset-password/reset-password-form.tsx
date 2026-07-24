"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "./actions";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Нууц үг шинэчлэгдлээ
          </h1>
          <p className="text-sm text-muted-foreground">
            Нууц үг амжилттай солигдлоо. одоо шинэ нууц үгээрээ нэвтэрнэ үү.
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Нэвтрэх
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Нууц үг шинэчлэх
        </h1>
        <p className="text-sm text-muted-foreground">
          Шинэ нууц үгээ оруулна уу.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Шинэ нууц үг
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="••••••••"
          />
          {state?.fieldErrors?.password && (
            <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Нууц үг давтах
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="••••••••"
          />
          {state?.fieldErrors?.confirmPassword && (
            <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        {state?.formError && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Шинэчлэж байна…" : "Нууц үг шинэчлэх"}
        </button>
      </form>
    </div>
  );
}
