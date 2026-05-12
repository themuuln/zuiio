import { getLocale, getTranslations } from "next-intl/server";

export default async function LocaleNotFoundPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Хуудас олдсонгүй</h2>
        <p className="mt-2 text-muted-foreground">
          {locale === "mn"
            ? "Таны хайсан хуудас байхгүй эсвэл зөвшөөрөлгүй байна."
            : "The page you're looking for doesn't exist or is unavailable."}
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          {locale === "mn" ? "Хяналтын самбар руу буцах" : "Back to Dashboard"}
        </a>
      </div>
    </div>
  );
}
