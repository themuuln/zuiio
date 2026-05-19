"use client";

import { CheckCircle2, ChevronDown, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm Email | TOLOM",
  description: "Confirm your email address",
};

export default function ConfirmEmailPage() {
  const t = useTranslations("auth.confirmEmail");
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setError(null);
    const supabase = createClient();
    startTransition(async () => {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) setError(resendError.message);
      else setResent(true);
    });
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        {resent ? (
          <CheckCircle2 className="size-6 text-green-600" />
        ) : (
          <Mail className="size-6 text-muted-foreground" />
        )}
      </div>
      <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {resent && (
        <p className="mt-4 text-sm text-green-600">{t("resentMessage")}</p>
      )}
      {!showResend ? (
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowResend(true)}
          >
            <ChevronDown className="size-4" />
            {t("resendPrompt")}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleResend} className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Mail />}
            {t("resend")}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
