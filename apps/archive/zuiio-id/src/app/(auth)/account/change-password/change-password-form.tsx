"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    undefined,
  );
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  if (state?.success) {
    return (
      <div className="animate-fade-in rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
            <span className="text-green-600 text-sm">&#x2713;</span>
          </div>
          <p className="text-sm text-foreground">
            Нууц үг амжилттай шинэчлэгдлээ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Нууц үг солих
      </h3>
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="currentPassword"
            className="text-xs font-medium text-muted-foreground"
          >
            Одоогийн нууц үг
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              required
              className="h-9 w-full rounded-lg border border-input bg-card px-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrent ? (
                <EyeSlashIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {state?.fieldErrors?.currentPassword && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.currentPassword[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="newPassword"
            className="text-xs font-medium text-muted-foreground"
          >
            Шинэ нууц үг
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              required
              className="h-9 w-full rounded-lg border border-input bg-card px-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNew ? (
                <EyeSlashIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {!state?.fieldErrors?.newPassword && (
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">Шаардлагууд:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                <li>Хамгийн багадаа 8 тэмдэгт</li>
                <li>Дор хаяж нэг том үсэг (A-Z)</li>
                <li>Дор хаяж нэг жижиг үсэг (a-z)</li>
                <li>Дор хаяж нэг тоо (0-9)</li>
              </ul>
            </div>
          )}
          {state?.fieldErrors?.newPassword && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.newPassword[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-medium text-muted-foreground"
          >
            Нууц үгээ давтана уу
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {state?.fieldErrors?.confirmPassword && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        {state?.formError && (
          <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="active-scale h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Шинэчилж байна…" : "Нууц үг солих"}
        </button>
      </form>
    </div>
  );
}
