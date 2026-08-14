import { getTranslations } from "next-intl/server";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as "en" | "mn",
    namespace: "invite",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
