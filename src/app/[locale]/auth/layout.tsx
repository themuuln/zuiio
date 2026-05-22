import { Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

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
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Wrench className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("name")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
