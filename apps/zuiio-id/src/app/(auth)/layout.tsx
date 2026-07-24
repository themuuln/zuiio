import type { Metadata } from "next";
import Image from "next/image";
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
          <div className="mb-8 flex animate-fade-in justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
              aria-label="Zuiio"
            >
              <Image
                src="/zuiio-logo.png"
                alt="Zuiio"
                width={32}
                height={32}
                className="rounded-lg dark:invert"
                priority
              />
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
