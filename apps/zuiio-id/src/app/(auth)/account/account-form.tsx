"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { logout } from "@/app/(auth)/logout/actions";
import { updateProfile } from "./actions";
import { MfaManager } from "./mfa-manager";
import { PasskeyManager } from "./passkey-manager";
import { SessionManager } from "./session-manager";

interface AccountFormProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    username: string;
    isOnboarding: boolean;
  };
}

export function AccountForm({ user }: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    undefined,
  );
  const showWelcome = user.isOnboarding && !state?.success;
  const router = useRouter();
  useEffect(() => {
    if (state?.success) {
      router.push("/");
    }
  }, [state?.success, router]);

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {showWelcome ? "Тавтай морилно уу!" : "Бүртгэлийн мэдээлэл"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {showWelcome
            ? "Zuiio бүртгэлээ дуусгахын тулд мэдээллээ бататгана уу."
            : "Таны нэгдсэн Zuiio бүртгэл"}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-foreground"
          >
            Бүтэн нэр
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={user.fullName}
            autoComplete="name"
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
            defaultValue={user.username}
            autoComplete="username"
            required
            placeholder="cooluser123"
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {state?.fieldErrors?.username && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.username[0]}
            </p>
          )}
        </div>

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
            value={user.email}
            disabled
            className="h-10 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Имэйлээ засах бол нэвтрэх системд хандана уу.
          </p>
        </div>

        {state?.formError && (
          <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        {state?.success && (
          <div className="animate-slide-up rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Мэдээлэл амжилттай шинэчлэгдлээ.
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="active-scale h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </form>

      {/* Session & connected products management */}
      <div className="rounded-lg border border-border bg-card p-4">
        <SessionManager />
      </div>

      {/* MFA management */}
      <div className="rounded-lg border border-border bg-card p-4">
        <MfaManager />
      </div>

      <PasskeyManager />

      <form action={logout}>
        <button
          type="submit"
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Гарах
        </button>
      </form>
    </div>
  );
}
