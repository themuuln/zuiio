"use client";
import Image from "next/image";
import { useState } from "react";

interface ConsentFormProps {
  authorizationId: string;
  clientName: string;
  clientLogoUri?: string;
  scope: string;
  redirectUri: string;
}

export function ConsentForm({
  authorizationId,
  clientName,
  clientLogoUri,
  scope,
}: ConsentFormProps) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestedScopes = scope.split(" ").filter(Boolean);
  const scopeLabels: Record<string, string> = {
    openid: "Нэвтрэх мэдээлэл",
    email: "Имэйл хаяг",
    profile: "Нэр, зураг",
    phone: "Утасны дугаар",
  };

  const handleDecision = async (decision: "approve" | "deny") => {
    setLoading(decision);
    setError(null);
    try {
      const response = await fetch("/api/oauth/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorization_id: authorizationId,
          decision,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.redirect_to) {
          window.location.href = data.redirect_to;
          return;
        }
        const code = data.error_code ?? "consent_failed";
        window.location.href = `/auth/error?code=${code}`;
        return;
      }

      if (data.redirect_to) {
        window.location.href = data.redirect_to;
      }
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
      setLoading(null);
    }
  };

  const initial = clientName.charAt(0).toUpperCase();

  return (
    <section
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="animate-fade-in rounded-xl border border-border bg-card p-5 sm:p-8"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Client avatar */}
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          {clientLogoUri ? (
            <Image
              src={clientLogoUri}
              alt={clientName}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <span className="text-xl font-bold text-primary">{initial}</span>
          )}
        </div>

        {/* Client info */}
        <div className="space-y-2">
          <h1
            id="consent-title"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            {clientName}
          </h1>
          <p id="consent-description" className="text-sm text-muted-foreground">
            Энэхүү програм дараах мэдээллүүдэд хандах хүсэлтэй байна
          </p>
        </div>

        {/* Requested permissions */}
        {requestedScopes.length > 0 && (
          <ul
            aria-label="Хандах мэдээллүүд"
            className="w-full space-y-2 text-left"
          >
            {requestedScopes.map((s) => (
              <li
                key={s}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Зөвшөөрөгдсөн мэдээлэл</title>
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </span>
                <span className="min-w-0 font-medium text-foreground">
                  {scopeLabels[s] ?? s}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="animate-shake w-full rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {/* Action buttons */}
        <fieldset className="flex w-full flex-col gap-3 border-0 p-0 pt-2 sm:flex-row-reverse">
          <legend className="sr-only">Зөвшөөрлийн үйлдлүүд</legend>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDecision("approve")}
            className="active-scale flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {loading === "approve" ? "Зөвшөөрч байна…" : "Зөвшөөрөх"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDecision("deny")}
            className="active-scale flex h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {loading === "deny" ? "Татгалзаж байна…" : "Татгалзах"}
          </button>
        </fieldset>

        {/* Footer */}
        <p className="w-full border-t border-border/60 pt-4 text-xs text-muted-foreground/70">
          Zuiio ID-аар хянасан
        </p>
      </div>
    </section>
  );
}
