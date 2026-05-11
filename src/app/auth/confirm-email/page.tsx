"use client";

import { CheckCircle2, ChevronDown, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmEmailPage() {
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsPending(true);
    setError(null);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }

    setIsPending(false);
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

      <h2 className="text-lg font-semibold text-foreground">
        Check your email
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a confirmation link to your email address. Click the link to
        activate your account.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {resent && (
        <p className="mt-4 text-sm text-green-600">
          Confirmation email resent. Check your inbox.
        </p>
      )}

      {!showResend ? (
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowResend(true)}
          >
            <ChevronDown className="size-4" />
            Didn&apos;t receive the email? Resend
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
            Resend confirmation
          </Button>
        </form>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
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
