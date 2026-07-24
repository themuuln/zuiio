"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary — catches errors from the locale layout
 * (DrawerProvider, QueryProvider, etc.) and all its children.
 *
 * This renders INSIDE the root layout (<html>/<body> already exist), but
 * MUST still avoid importing client components that may have failed to load.
 * Uses inline styles and best-effort Sentry reporting.
 */
export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportToSentry(error, "root");
  }, [error]);

  return (
    <div className="ez-error-root">
      <div className="ez-error-card">
        <div className="ez-error-code">500</div>
        <h2 className="ez-error-title">Something went wrong</h2>
        <p className="ez-error-message">
          An unexpected error occurred. Please try again.
        </p>
        <div className="ez-error-actions">
          <button className="ez-btn ez-btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <a href="/dashboard" className="ez-btn ez-btn-secondary">
            Dashboard
          </a>
        </div>
      </div>
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
  .ez-error-root {
    display: flex;
    min-height: 100dvh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: #09090b;
    color: #fafafa;
    font-family: system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .ez-error-card { text-align: center; max-width: 400px; }
  .ez-error-code {
    font-size: 3.75rem;
    font-weight: 600;
    color: rgba(239, 68, 68, 0.3);
    margin: 0 0 0.5rem;
  }
  .ez-error-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }
  .ez-error-message {
    color: #a1a1aa;
    font-size: 0.875rem;
    margin: 0 0 1.5rem;
  }
  .ez-error-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }
  .ez-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    border: none;
    transition: background 0.15s ease;
  }
  .ez-btn-primary {
    background: #3b82f6;
    color: white;
  }
  .ez-btn-primary:hover { background: #2563eb; }
  .ez-btn-secondary {
    border: 1px solid #27272a;
    background: transparent;
    color: #fafafa;
  }
  .ez-btn-secondary:hover { background: #27272a; }
`;

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
