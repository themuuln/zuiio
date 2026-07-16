"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resendVerification } from "./actions";

export function VerifyEmailForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(
    resendVerification,
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
            Баталгаажуулах холбоосыг таны имэйл хаягт илгээлээ. Шалгана уу.
          </p>
          <p className="text-xs text-muted-foreground">
            Имэйл ирээгүй бол спам хавтсыг шалгаад дахин илгээнэ үү.
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Нэвтрэх хуудас руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Имэйлээ баталгаажуулна уу
        </h1>
        <p className="text-sm text-muted-foreground">
          Бид таны имэйл хаяг руу баталгаажуулах холбоос илгээсэн.
          Дараагийн алхам руу явахын тулд имэйлээ шалгаад холбоос дээр дарна уу.
        </p>
      </div>

      {email && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">Илгээсэн имэйл:</p>
          <p className="text-sm font-medium text-foreground break-all">
            {email}
          </p>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {email && <input type="hidden" name="email" value={email} />}

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
          {isPending ? "Илгээж байна…" : "Дахин илгээх"}
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
