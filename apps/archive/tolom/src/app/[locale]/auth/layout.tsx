import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { Typography } from "@/components/ui/typography";
import { AuthShowcaseMock } from "./_auth-showcase";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export const metadata: Metadata = {
  title: "Auth",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("app");
  const s = await getTranslations("auth.showcase");

  return (
    <div className="h-dvh flex flex-col md:grid md:grid-cols-12 bg-background select-none overscroll-none">
      {/* Left showcase — brand panel, desktop only */}
      <aside className="relative hidden md:flex md:col-span-7 lg:col-span-6 flex-col justify-between overflow-hidden bg-zinc-950 p-10 lg:p-14">
        {/* Ambient brand glow (violet identity + teal accent) */}
        <div className="pointer-events-none absolute -top-32 -left-32 size-[28rem] rounded-full bg-[radial-gradient(circle,var(--brand-violet-glow),transparent_65%)]" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 size-[30rem] rounded-full bg-[radial-gradient(circle,var(--brand-teal-glow),transparent_65%)]" />

        {/* Header */}
        <header className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-teal)] shadow-brand">
            <span className="font-heading text-lg font-bold text-white">T</span>
          </div>
          <span className="font-heading text-base font-bold tracking-[0.18em] text-white">
            {t("name")}
          </span>
        </header>

        {/* Hero + product mock */}
        <div className="relative z-10 flex flex-col gap-10">
          <div className="max-w-md">
            <h2 className="text-3xl lg:text-[2.5rem] font-bold leading-[1.15] tracking-tight text-white">
              {s("headline")}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
              {s("subline")}
            </p>
          </div>
          <AuthShowcaseMock appName={t("name")} />
        </div>

        {/* Footer */}
        <footer className="relative z-10 flex items-center gap-2 text-xs text-zinc-500">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>{s("trust")}</span>
        </footer>
      </aside>

      {/* Right side — form */}
      <main className="relative flex-1 flex col-span-12 md:col-span-5 lg:col-span-6 flex-col items-center justify-start md:justify-center overflow-y-auto h-dvh">
        {/* Soft brand wash behind the card */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,var(--brand-gradient-subtle),transparent_70%)]" />

        <div className="relative flex w-full flex-1 flex-col">
          {/* Brand header for mobile only (hidden on desktop) */}
          <div className="mb-8 text-center md:hidden">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-teal)] shadow-brand">
              <span className="font-heading text-lg font-bold text-white">
                T
              </span>
            </div>
            <Typography.H1 className="text-xl font-bold tracking-tight text-foreground">
              {t("name")}
            </Typography.H1>
            <Typography.Muted className="mt-1.5 text-xs text-muted-foreground">
              {t("tagline")}
            </Typography.Muted>
          </div>

          {/* Form wrapper */}
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-card p-5 sm:p-6">
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
