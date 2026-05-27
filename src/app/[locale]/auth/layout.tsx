import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Auth",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("app");
  return (
    <div className="h-dvh flex flex-col md:grid md:grid-cols-12 bg-background select-none overscroll-none">
      {/* Left side showcase - visible on desktop */}
      <div className="hidden md:flex md:col-span-7 lg:col-span-8 bg-zinc-950 border-r border-zinc-900 flex-col p-10 relative overflow-hidden h-full">
        {/* Abstract futuristic grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1.5px,transparent_1.5px),linear-gradient(to_bottom,#1f1f23_1.5px,transparent_1.5px)] bg-[size:4rem_4rem] opacity-35" />

        {/* Glow points for high tech aesthetic */}
        <div className="absolute top-10 left-10 size-[300px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 size-[300px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />

        {/* Content wrapper */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          <AuthShowcase />
        </div>
      </div>

      {/* Right side form card */}
      <div className="flex-1 flex col-span-12 md:col-span-5 lg:col-span-4 flex-col items-center md:justify-center justify-start p-6 sm:p-12 bg-gradient-to-br from-background via-muted/20 to-muted/40 relative overflow-y-auto min-h-dvh">
        {/* Subtle grid lines background overlay for card side */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Brand Header for Mobile Screen only (hidden on desktop) */}
          <div className="mb-8 text-center md:hidden">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-heading text-lg font-bold tracking-widest text-foreground">
                T
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t("name")}
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          {/* Form wrapper */}
          <div className="border border-border bg-card p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative group/card">
            {/* Tech styling corner accents */}
            <div className="absolute -top-px -left-px size-2 border-t border-l border-zinc-500 opacity-30 group-hover/card:opacity-75 transition-opacity" />
            <div className="absolute -top-px -right-px size-2 border-t border-r border-zinc-500 opacity-30 group-hover/card:opacity-75 transition-opacity" />
            <div className="absolute -bottom-px -left-px size-2 border-b border-l border-zinc-500 opacity-30 group-hover/card:opacity-75 transition-opacity" />
            <div className="absolute -bottom-px -right-px size-2 border-b border-r border-zinc-500 opacity-30 group-hover/card:opacity-75 transition-opacity" />

            {children}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
