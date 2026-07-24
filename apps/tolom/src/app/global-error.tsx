"use client";
import { useEffect } from "react";

/**
 * Global error boundary — LAST line of defense.
 *
 * This replaces the ENTIRE document (own <html>/<body>). It MUST be fully
 * self-contained with zero external component imports because it runs when
 * loading of ANY JS chunk has already failed — importing our component
 * library would also fail to load, producing a white screen instead of an
 * error message.
 *
 * - No imports from @/components/ui/* or any client component
 * - Inline styles only
 * - Sentry reporting via dynamic import (justified: Sentry's own chunk may
 *   also be the one that failed, so a static import would kill the module)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry — best-effort. The dynamic import avoids crashing the
    // error UI itself if Sentry's own chunk failed to load (justified: the
    // chunk(s) that failed are unknown at author time).
    reportToSentry(error, "global");
  }, [error]);

  return (
    <html lang="mn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TOLOM — Алдаа гарлаа</title>
        <style>{STYLES}</style>
      </head>
      <body className="error-body">
        <div className="error-card">
          <div className="error-icon">!</div>
          <h1 className="error-title">Системд алдаа гарлаа</h1>
          <p className="error-message">
            Уучлаарай, системийн алдаа гарлаа. Дахин ачаална уу.
          </p>
          <button
            type="button"
            className="error-button"
            onClick={() => reset()}
          >
            Дахин оролдох
          </button>
          <p className="error-hint">
            If the problem persists, please contact support.
          </p>
        </div>
      </body>
    </html>
  );
}

/* ── Inline styles ───────────────────────────────────────────── */

const STYLES = `
  .error-body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #09090b;
    color: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  .error-card {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
  }
  .error-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    background: #450a0a;
    color: #f87171;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
  }
  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: #fafafa;
  }
  .error-message {
    color: #a1a1aa;
    line-height: 1.5;
    margin: 0 0 2rem;
    font-size: 0.875rem;
  }
  .error-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .error-button:hover { background: #2563eb; }
  .error-button:active { background: #1d4ed8; }
  .error-hint {
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: #52525b;
  }
`;

/* ── Sentry reporting — best-effort ──────────────────────────── */

async function reportToSentry(
  error: Error & { digest?: string },
  boundary: string,
) {
  try {
    const { capture } = await import("@zuiio/capture");
    capture(error, { context: `[error-boundary] ${boundary}` });
  } catch {
    // Sentry chunk may also fail to load — never let reporting crash the UI
  }
}
