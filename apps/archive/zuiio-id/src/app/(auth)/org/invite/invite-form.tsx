"use client";

import { useActionState } from "react";
import { inviteMember } from "./actions";

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, formAction, isPending] = useActionState(
    inviteMember,
    undefined,
  );

  if (state?.success) {
    return (
      <div className="animate-fade-in rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-sm text-foreground">Урилга илгээгдлээ!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Имэйл хаяг руу урилга илгээгдлээ.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orgId" value={orgId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Имэйл хаяг
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          placeholder="name@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-foreground">
          Эрх
        </label>
        <select
          id="role"
          name="role"
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <option value="member">Гишүүн</option>
          <option value="admin">Админ</option>
          <option value="viewer">Үзэгч</option>
        </select>
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
        {isPending ? "Илгэж байна…" : "Урилга илгээх"}
      </button>
    </form>
  );
}
