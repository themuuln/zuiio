"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

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

  // Parse requested scopes for display
  const requestedScopes = scope.split(" ").filter(Boolean);
  const scopeDescriptions: Record<string, string> = {
    openid: "Таны нэвтрэх мэдээлэл",
    email: "Таны имэйл хаяг",
    profile: "Таны нэр, зураг",
    phone: "Таны утасны дугаар",
  };
  const scopeColors: Record<string, string> = {
    openid: "bg-primary/10 text-primary",
    email: "bg-info/10 text-info",
    profile: "bg-muted text-muted-foreground",
    phone: "bg-warning/10 text-warning",
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
        // Protocol-level denial follows the SDK's registered client redirect
        if (data.redirect_to) {
          window.location.href = data.redirect_to;
          return;
        }
        // Other errors go to the error page
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
    <div className="animate-fade-in rounded-lg border border-border bg-card p-6">
      <div className="text-center">
        {/* App logo or initial fallback */}
        {clientLogoUri ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={clientLogoUri}
              alt={clientName}
              width={64}
              height={64}
              unoptimized
              className="h-full w-full object-contain"
              onError={(e) => {
                // Hide broken image, the initial fallback will show via CSS
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted text-xl font-semibold text-muted-foreground">
            {initial}
          </div>
        )}

        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {clientName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          дараах мэдээлэлд хандахыг хүсч байна:
        </p>
      </div>

      {/* Scope list */}
      <div className="mt-6 space-y-3">
        {requestedScopes.map((scopeItem) => (
          <div key={scopeItem} className="stagger-item flex items-center gap-3" style={{ "--i": requestedScopes.indexOf(scopeItem) } as CSSProperties}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium ${scopeColors[scopeItem] ?? "bg-muted text-muted-foreground"}`}>
              {scopeItem.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-foreground">
              {scopeDescriptions[scopeItem] ?? scopeItem}
            </span>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="animate-slide-down mt-4 text-center text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => handleDecision("approve")}
          disabled={loading !== null}
          className="active-scale w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading === "approve" ? "Баталгаажуулж байна..." : "Зөвшөөрөх"}
        </button>
        <button
          type="button"
          onClick={() => handleDecision("deny")}
          disabled={loading !== null}
          className="active-scale w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading === "deny" ? "Татгалзаж байна..." : "Татгалзах"}
        </button>
      </div>
    </div>
  );
}
