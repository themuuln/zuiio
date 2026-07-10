"use client";

import { captureException } from "@sentry/nextjs";

/**
 * Root-level error boundary.
 *
 * This catches errors thrown in the root layout — the one place where the
 * per-route `error.tsx` does NOT catch them. Without this, a root-layout crash
 * would render a blank white page with no error indication.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Send to Sentry
  captureException(error);

  return (
    <html lang="mn">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Системд алдаа гарлаа
          </h1>
          <p style={{ color: "#666", maxWidth: "400px" }}>
            Туршлагын тав тухыг хангахаар ажиллаж байна. Түр хүлээнэ үү.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
