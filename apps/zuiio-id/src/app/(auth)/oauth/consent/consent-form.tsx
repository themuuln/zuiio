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
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Client avatar */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
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
        <div>
          <h2 className="text-sm font-medium text-foreground">{clientName}</h2>
          <p className="text-xs text-muted-foreground">
            Таны эрхийг хүсч байна
          </p>
        </div>

        {/* Requested permissions */}
        {requestedScopes.length > 0 && (
          <div className="w-full space-y-2">
            {requestedScopes.map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${scopeColors[s] ?? "bg-muted text-muted-foreground"}`}
              >
                <span className="font-medium">{s}</span>
                <span className="opacity-70">{scopeDescriptions[s] ?? s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Action buttons */}
        <div className="flex w-full gap-3 pt-2">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDecision("deny")}
            className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading === "deny" ? "Татгалзаж байна..." : "Татгалзах"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleDecision("approve")}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading === "approve" ? "Зөвшөөрч байна..." : "Зөвшөөрөх"}
          </button>
        </div>

        {/* Powered by */}
        <p className="pt-2 text-[10px] text-muted-foreground/50">
          Zuiio ID-аар хянасан
        </p>
      </div>
    </div>
  );
}
