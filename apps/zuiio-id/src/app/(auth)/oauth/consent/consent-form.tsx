"use client";

import Image from "next/image";
import { useState } from "react";

interface ConsentFormProps {
  authorizationId: string;
  projectRef: string;
  clientName: string;
  clientLogoUri?: string;
  scope: string;
  redirectUri: string;
}

export function ConsentForm({
  authorizationId,
  projectRef,
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
          project_ref: projectRef,
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
      <div className="mb-5 flex items-center gap-3">
        {clientLogoUri ? (
          <Image
            src={clientLogoUri}
            alt={clientName}
            width={40}
            height={40}
            className="rounded-lg"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
          >
            {initial}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-foreground">{clientName}</p>
          <p className="text-xs text-muted-foreground">
            Зөвшөөрөл хүсч байна
          </p>
        </div>
      </div>

      <div className="mb-5 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Нэвтрэх эрх
        </p>
        {requestedScopes.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${scopeColors[s] ?? "bg-muted text-muted-foreground"}`}
            >
              {scopeDescriptions[s] ?? s}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-xs text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleDecision("deny")}
          disabled={loading !== null}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading === "deny" ? "Татгалзаж байна..." : "Татгалзах"}
        </button>
        <button
          type="button"
          onClick={() => handleDecision("approve")}
          disabled={loading !== null}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading === "approve" ? "Зөвшөөрч байна..." : "Зөвшөөрөх"}
        </button>
      </div>
    </div>
  );
}
