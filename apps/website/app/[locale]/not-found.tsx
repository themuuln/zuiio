import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="relative isolate mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center overflow-hidden">
      <div
        className="pointer-events-none absolute -inset-32 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, var(--brand-violet-glow), transparent)",
        }}
        aria-hidden="true"
      />
      <h1
        className="text-7xl font-bold tracking-tight md:text-8xl"
        style={{
          fontFamily: "var(--font-display)",
          background:
            "linear-gradient(135deg, var(--brand-violet), var(--brand-teal))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("message")}</p>
      <Link href="/" className="btn-primary mt-8">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        {t("cta")}
      </Link>
    </div>
  );
}
