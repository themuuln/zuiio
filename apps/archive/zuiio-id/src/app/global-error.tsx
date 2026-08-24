"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="mn">
      <body>
        <main>
          <h1>Түр алдаа гарлаа.</h1>
          <p>Хуудсыг дахин ачаалаад үргэлжлүүлнэ үү.</p>
          <button onClick={reset} type="button">
            Дахин оролдох
          </button>
        </main>
      </body>
    </html>
  );
}
