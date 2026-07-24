import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  type LegalDocument,
  LegalPage,
  type LegalSection,
} from "../legal-page";

interface Props {
  params: Promise<{ locale: string }>;
}

function buildSections(
  t: (key: string) => string,
  tHas: (key: string) => boolean,
  count: number,
): LegalSection[] {
  const sections: LegalSection[] = [];
  for (let i = 0; i < count; i++) {
    const section: LegalSection = {
      id: t(`section-${i}-id`),
      title: t(`section-${i}-title`),
      paragraphs: [],
    };
    for (let j = 0; tHas(`section-${i}-p${j}`); j++) {
      section.paragraphs.push(t(`section-${i}-p${j}`));
    }
    const bullets: string[] = [];
    for (let j = 0; tHas(`section-${i}-b${j}`); j++) {
      bullets.push(t(`section-${i}-b${j}`));
    }
    if (bullets.length > 0) section.bullets = bullets;
    sections.push(section);
  }
  return sections;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DataDeletionPage" });
  return {
    title: t("eyebrow"),
    description: t("description"),
    alternates: { canonical: "/data-deletion" },
  };
}

export default async function DataDeletionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DataDeletionPage");
  const tHas = t.has.bind(t);

  const document: LegalDocument = {
    eyebrow: t("eyebrow"),
    title: t("title"),
    description: t("description"),
    lastUpdated: t("lastUpdated"),
    sections: buildSections(t, tHas, 7),
  };

  return <LegalPage {...document} />;
}
