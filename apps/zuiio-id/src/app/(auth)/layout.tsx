import type { Metadata } from "next";
import { ThemeProvider } from "@/app/theme-provider";

export const metadata: Metadata = {
  title: "Zuiio ID — Нэвтрэх систем",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
        <main className="w-full max-w-sm">
          {/* Zuiio wordmark */}
          <div className="mb-8 flex justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
              aria-label="Zuiio"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
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
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
