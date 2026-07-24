"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Tolom SSO start page.
 *
 * Shows a loading card while initiating login through the Zuiio identity
 * provider (`custom:zuiio`). The OAuth URL is fetched from an API route,
 * then the browser redirects to the external provider.
 */
export default function SsoStartPage() {
  return (
    <Suspense fallback={<SsoLoadingCard />}>
      <SsoStartClient />
    </Suspense>
  );
}

function SsoLoadingCard() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 animate-pulse">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
        Connecting to SSO...
      </span>
    </div>
  );
}

function SsoStartClient() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initiate() {
      try {
        const res = await fetch(
          `/api/auth/sso?next=${encodeURIComponent(next)}`,
        );

        if (cancelled) return;

        if (!res.ok) {
          setError("auth_start_failed");
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (data.url) {
          window.location.replace(data.url);
        } else {
          setError("auth_start_failed");
        }
      } catch {
        if (!cancelled) setError("auth_start_failed");
      }
    }

    initiate();

    return () => {
      cancelled = true;
    };
  }, [next]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <span className="text-xs text-destructive font-mono">
          SSO login failed.{" "}
          <a href="/auth/login" className="underline hover:text-foreground">
            Back to login
          </a>
        </span>
      </div>
    );
  }

  return <SsoLoadingCard />;
}
