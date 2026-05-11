"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    null,
  );

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Mail className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists with that email, we&apos;ve sent a password reset
          link.
        </p>
        <p className="mt-6 text-sm">
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Reset your password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="you@example.com"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Mail />}
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
