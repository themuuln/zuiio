"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";

export function SignupForm({
  product,
  returnTo,
}: {
  product?: string;
  returnTo?: string;
}) {
  const [state, formAction, isPending] = useActionState(signup, undefined);

  if (state?.redirectTo) {
    window.location.href = state.redirectTo;
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Бүртгүүлэх
        </h1>
        <p className="text-sm text-muted-foreground">
          Zuiio бүртгэл үүсгэх
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {product && <input type="hidden" name="product" value={product} />}
        {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Бүтэн нэр
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="Батбилэг Ц"
          />
          {state?.fieldErrors?.fullName && (
            <p className="text-xs text-destructive">{state.fieldErrors.fullName[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium text-foreground">
            Нэр <span className="text-muted-foreground">(сонгох)</span>
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="batbilig"
          />
          {state?.fieldErrors?.username && (
            <p className="text-xs text-destructive">{state.fieldErrors.username[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Имэйл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="name@example.com"
          />
          {state?.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Нууц үг
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
          {isPending ? "Бүртгүүлж байна…" : "Бүртгүүлэх"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Нэвтрэх
        </Link>
      </p>
    </div>
  );
}
