"use client";

import { logout } from "@/app/(auth)/logout/actions";

import { useActionState } from "react";
import { updateProfile } from "./actions";

interface AccountFormProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    username: string;
  };
}

export function AccountForm({ user }: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Бүртгэлийн мэдээлэл
        </h1>
        <p className="text-sm text-muted-foreground">
          Таны нэгдсэн Zuiio бүртгэл
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Бүтэн нэр
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={user.fullName}
            autoComplete="name"
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          {state?.fieldErrors?.fullName && (
            <p className="text-xs text-destructive">{state.fieldErrors.fullName[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium text-foreground">
            Нэр
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={user.username}
            autoComplete="username"
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          {state?.fieldErrors?.username && (
            <p className="text-xs text-destructive">{state.fieldErrors.username[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Имэйл</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="h-10 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">Имэйлээ засах бол нэвтрэх системд хандана уу.</p>
        </div>

        {state?.formError && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        {state?.success && (
          <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            Мэдээлэл амжилттай шинэчлэгдлээ.
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </form>
      <form action={logout}>
        <button
          type="submit"
          className="h-11 w-full rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Гарах
        </button>
      </form>
    </div>
  );
}
