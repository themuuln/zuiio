import { getTranslations } from "next-intl/server";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as "en" | "mn",
    namespace: "auth.resetPassword",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
