import { Suspense } from "react";
import { ThemeProvider } from "@/app/theme-provider";
import { AUTH_ERRORS, type AuthErrorCode } from "@/lib/errors";

/**
 * Auth error page.
 *
 * Renders a Mongolian, flat-depth error surface for all OAuth and auth failures.
 * Shows a safe retry link and a link back to /login. Never echoes provider
 * messages or accepts arbitrary external return_to parameters.
 */
/** PPR: static shell renders immediately, error code streams in via Suspense. */
export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
        <main className="w-full max-w-sm">
          <div className="flex animate-fade-in flex-col gap-6">
            {/* Static error shell — always renders */}
            {/* Zuiio wordmark */}
            <div className="mb-2 flex justify-center">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
                aria-label="Zuiio"
              >
                <svg
                  aria-hidden="true"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <rect
                    width="32"
                    height="32"
                    rx="8"
                    fill="currentColor"
                    className="text-primary"
                  />
                  <path
                    d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16"
                    stroke="currentColor"
                    className="text-primary-foreground"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 20C12 17.79 13.79 16 16 16C18.21 16 20 17.79 20 20"
                    stroke="currentColor"
                    className="text-primary-foreground"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xl font-semibold tracking-tight">
                  Zuiio
                </span>
              </a>
            </div>
            {/* Error icon + heading */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  aria-hidden="true"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-destructive"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Алдаа гарлаа
              </h1>
            </div>
            {/* Dynamic error message — streams in */}
            <Suspense
              fallback={
                <div className="rounded-lg border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">Ачаалж байна…</p>
                </div>
              }
            >
              <ErrorContent searchParams={searchParams} />
            </Suspense>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const code = params.code as AuthErrorCode | undefined;

  const error = code ? AUTH_ERRORS[code] : undefined;
  const message =
    error?.message ?? "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.";

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="mt-2 text-sm text-foreground">{message}</p>
      <div className="mt-6 space-y-3">
        <a
          href="/login"
          className="active-scale flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Дахин оролдох
        </a>
        <a
          href="/"
          className="flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Нүүр хуудас руу буцах
        </a>
      </div>
    </div>
  );
}
