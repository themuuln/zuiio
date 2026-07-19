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
    <div className="animate-fade-in rounded-lg border border-border bg-card p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Client avatar */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
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
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {clientName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Энэхүү програм дараах мэдээллүүдэд хандах хүсэлтэй байна
          </p>
        </div>

        {/* Requested permissions */}
        {requestedScopes.length > 0 && (
          <div className="w-full space-y-2">
            {requestedScopes.map((s) => (
              <div
                key={s}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/50 px-4 py-2.5 text-left text-sm"
              >
                <span className="font-medium text-foreground">{s}</span>
                <span className="text-muted-foreground">
                  {scopeLabels[s] ?? s}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex w-full gap-3 pt-2">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDecision("deny")}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 active:scale-[0.98]"
          >
            {loading === "deny" ? "Татгалзаж байна…" : "Татгалзах"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDecision("approve")}
            className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 active:scale-[0.98]"
          >
            {loading === "approve" ? "Зөвшөөрч байна…" : "Зөвшөөрөх"}
          </button>
        </div>

        {/* Footer */}
        <p className="pt-1 text-xs text-muted-foreground/60">
          Zuiio ID-аар хянасан
        </p>
      </div>
    </div>
  );
}

