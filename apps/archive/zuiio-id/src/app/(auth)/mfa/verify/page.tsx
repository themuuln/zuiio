"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * MFA verification page.
 *
 * Shown when a user with a verified TOTP factor attempts an action
 * requiring AAL2 (e.g., first-time consent or remembered-consent redirect).
 * After successful verification, redirects back to the pending authorization.
 */
export default function MfaVerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("6 оронтоо код оруулна уу.");
      return;
    }

    setLoading(true);
    setError(null);

    // Get the current AAL level
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (!aalData?.currentLevel || aalData.currentLevel === "aal2") {
      // Already at AAL2, redirect back
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next ?? "/");
      return;
    }

    // Find the verified TOTP factor
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const totpFactor = factorsData?.totp?.find((f) => f.status === "verified");

    if (!totpFactor) {
      setError("MFA хүчин зүйл олдсонгүй.");
      setLoading(false);
      return;
    }

    // Challenge and verify in one step
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: totpFactor.id,
      code,
    });

    if (verifyError) {
      setError("Код буруу байна. Дахин оролдоно уу.");
      setLoading(false);
      return;
    }

    // Success — redirect to the pending authorization or home
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ?? "/");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <main className="w-full max-w-sm">
        {/* Zuiio wordmark */}
        <div className="mb-8 flex justify-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
            aria-label="Zuiio"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <rect
                width="32"
                height="32"
                rx="8"
                fill="currentColor"
                className="text-primary"
              />
              <path
                d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16"
                stroke="currentColor"
                className="text-primary-foreground"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M12 20C12 17.79 13.79 16 16 16C18.21 16 20 17.79 20 20"
                stroke="currentColor"
                className="text-primary-foreground"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-semibold tracking-tight">Zuiio</span>
          </a>
        </div>

        <div className="animate-fade-in rounded-lg border border-border bg-card p-6">
          <h1 className="text-center text-lg font-semibold text-foreground">
            Нэмэлт баталгаа
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            TOTP апп-аас кодоо оруулна уу.
          </p>

          {error && (
            <div className="animate-slide-down mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6 оронтоо код"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify();
              }}
              className="h-12 rounded-lg border border-input bg-background px-3 text-center text-lg font-mono tracking-[0.3em] text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="active-scale h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Шалгаж байна..." : "Баталгаажуулах"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
