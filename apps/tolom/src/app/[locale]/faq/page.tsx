import { ArrowRight, HelpCircle, Wrench } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LandingNav } from "@/components/landing-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

import { FaqContent } from "./_faq-content";

const CATEGORIES: {
  key: string;
  questions: { q: string; a: string }[];
}[] = [
  {
    key: "general",
    questions: [
      { q: "whatIsTolom", a: "whatIsTolomAnswer" },
      { q: "whoIsFor", a: "whoIsForAnswer" },
      { q: "industries", a: "industriesAnswer" },
    ],
  },
  {
    key: "features",
    questions: [
      { q: "mainFeatures", a: "mainFeaturesAnswer" },
      { q: "inventory", a: "inventoryAnswer" },
      { q: "production", a: "productionAnswer" },
      { q: "pos", a: "posAnswer" },
      { q: "reports", a: "reportsAnswer" },
    ],
  },
  {
    key: "pricing",
    questions: [
      { q: "pricingModel", a: "pricingModelAnswer" },
      { q: "freeTrial", a: "freeTrialAnswer" },
      { q: "cancel", a: "cancelAnswer" },
      { q: "hiddenFees", a: "hiddenFeesAnswer" },
    ],
  },
  {
    key: "data",
    questions: [
      { q: "dataSecurity", a: "dataSecurityAnswer" },
      { q: "dataExport", a: "dataExportAnswer" },
      { q: "offline", a: "offlineAnswer" },
    ],
  },
  {
    key: "support",
    questions: [
      { q: "supportChannels", a: "supportChannelsAnswer" },
      { q: "responseTime", a: "responseTimeAnswer" },
      { q: "training", a: "trainingAnswer" },
    ],
  },
  {
    key: "integration",
    questions: [
      { q: "existingSystem", a: "existingSystemAnswer" },
      { q: "import", a: "importAnswer" },
      { q: "api", a: "apiAnswer" },
    ],
  },
  {
    key: "account",
    questions: [
      { q: "multipleBranches", a: "multipleBranchesAnswer" },
      { q: "userPermissions", a: "userPermissionsAnswer" },
      { q: "changePlan", a: "changePlanAnswer" },
    ],
  },
  {
    key: "legal",
    questions: [
      { q: "terms", a: "termsAnswer" },
      { q: "privacy", a: "privacyAnswer" },
      { q: "sla", a: "slaAnswer" },
    ],
  },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <FaqPageContent locale={locale} />;
}

async function FaqPageContent({ locale }: { locale: string }) {
  "use cache";
  cacheLife("daily");

  const t = (await getTranslations({ locale: locale as "mn" | "en", namespace: "faq" })) as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const appT = (await getTranslations({ locale: locale as "mn" | "en", namespace: "app" })) as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main>
        <section className="border-b bg-gradient-to-b from-muted/30 to-background px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl">
            <Badge variant="outline" className="mb-4">
              <HelpCircle className="mr-1 size-3" />
              FAQ
            </Badge>
            <Typography.H1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("pageTitle")}
            </Typography.H1>
            <Typography.Muted className="mt-3 text-base text-muted-foreground sm:text-lg">
              {t("pageDescription")}
            </Typography.Muted>
          </div>
        </section>

        <FaqContent categories={CATEGORIES} />

        <section className="border-t bg-gradient-to-br from-primary/5 via-primary/[3%] to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <Typography.H2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Өөр асуулт байна уу?
            </Typography.H2>
            <Typography.Muted className="mt-3 text-muted-foreground">
              Хариултаа олоогүй бол бидэнтэй холбогдоорой. Бид туслахад баяртай
              байх болно.
            </Typography.Muted>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                render={<Link href="/auth/signup" />}
                nativeButton={false}
              >
                TOLOM-г үнэгүй турших
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="/auth/login" />}
                nativeButton={false}
              >
                Нэвтрэх
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2">
            <Wrench className="size-3" />
            <span className="font-semibold text-foreground">
              {appT("name")}
            </span>
          </div>
          <Typography.Text className="mt-2">{appT("tagline")}</Typography.Text>
        </div>
      </footer>
    </div>
  );
}
