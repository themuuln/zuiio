"use client";

import { Loader2, Lock } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resetPassword } from "./actions";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Set new password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password for your account
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
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="At least 8 characters"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Re-enter your password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Lock />}
          Reset password
        </Button>
      </form>
    </div>
  );
}
