"use client";

import { useState } from "react";

interface ConsentFormProps {
  authorizationId: string;
  clientName: string;
  scope: string;
  redirectUri: string;
}

export function ConsentForm({
  authorizationId,
  clientName,
  scope,
}: ConsentFormProps) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);

  // Parse requested scopes for display
  const requestedScopes = scope.split(" ").filter(Boolean);
  const scopeDescriptions: Record<string, string> = {
    openid: "Таны нэвтрэх мэдээлэл",
    email: "Таны имэйл хаяг",
    profile: "Таны нэр, зураг",
    phone: "Таны утасны дугаар",
  };

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const response = await fetch("/api/oauth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorization_id: authorizationId }),
      });
      const data = await response.json();
      if (data.redirect_to) {
        window.location.href = data.redirect_to;
      } else if (data.error) {
        alert(data.error);
        setLoading(null);
      }
    } catch {
      alert("Алдаа гарлаа");
      setLoading(null);
    }
  };

  const handleDeny = async () => {
    setLoading("deny");
    try {
      const response = await fetch("/api/oauth/deny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorization_id: authorizationId }),
      });
      const data = await response.json();
      if (data.redirect_to) {
        window.location.href = data.redirect_to;
      }
    } catch {
      alert("Алдаа гарлаа");
      setLoading(null);
    }
  };

  // First letter of client name for avatar
  const initial = clientName.charAt(0).toUpperCase();

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="text-center">
        {/* App icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl font-bold text-muted-foreground">
            {initial}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-foreground">
          Зөвшөөрөл шаардлагатай
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{clientName}</span>{" "}
          таны бүртгэлд хандахыг хүсч байна
        </p>
      </div>

      {/* Scope list */}
      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-foreground">
          Дараах мэдээллийг хандахыг зөвшөөрч байна:
        </p>
        <ul className="space-y-2">
          {requestedScopes.map((s) => (
            <li
              key={s}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {scopeDescriptions[s] || s}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading === "approve" ? "Боловсруулж байна..." : "Зөвшөөрөх"}
        </button>

        <button
          onClick={handleDeny}
          disabled={loading !== null}
          className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading === "deny" ? "Боловсруулж байна..." : "Цуцлах"}
        </button>
      </div>
    </div>
  );
}
