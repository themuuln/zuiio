"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { completeWelcome } from "./actions";

export function WelcomeForm({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    completeWelcome,
    undefined,
  );

  if (state?.redirectTo) {
    router.push(state.redirectTo);
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Тавтай морилно уу!
        </h1>
        <p className="text-sm text-muted-foreground">
          Zuiio системд тавтай морил. Доорх мэдээллээ бататгана уу.
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
            type="email"
            value={userEmail}
            disabled
            className="h-10 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-foreground"
          >
            Нэр
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={userName}
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="Таны нэр"
          />
          {state?.fieldErrors?.fullName && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.fullName[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="username"
            className="text-sm font-medium text-foreground"
          >
            Хэрэглэгчийн нэр
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            placeholder="cooluser123"
          />
          {state?.fieldErrors?.username && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.username[0]}
            </p>
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
          {isPending ? "Хадгалж байна..." : "Үргэлжлүүлэх"}
        </button>
      </form>
    </div>
  );
}
