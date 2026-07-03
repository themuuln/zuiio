import type { Metadata } from "next";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Offline | TOLOM",
};

import { RetryButton } from "./_retry-button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-8 text-center">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <svg
            className="size-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <title>Offline</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M9.51 9.51A8 8 0 0115 7.5m-6.5 3.5A6 6 0 0121 12m-10.5 2a4 4 0 016 0m-8.5 1.5A8 8 0 0122 15"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Та интернэтгүй байна
        </h1>
        <p className="text-muted-foreground">
          Интернэт холболтоо шалгаад дахин оролдоно уу.
        </p>
        <p className="text-sm text-muted-foreground">
          You are offline. Please check your connection.
        </p>
        <RetryButton />
      </div>
    </main>
  );
}
