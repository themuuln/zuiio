import { Hero } from "@/components/marketing/Hero";
import { PricingCard } from "@/components/marketing/PricingCard";
import { getTranslations, setRequestLocale } from "next-intl/server";

const plans = [
	{ key: "starter" },
	{ key: "pro", highlighted: true },
	{ key: "enterprise" },
];

const maxFeatures: Record<string, number> = {
	starter: 4,
	pro: 6,
	enterprise: 5,
};

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "PricingPage" });
	return { title: t("title"), description: t("subtitle") };
}

export default async function PricingPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("PricingPage");

	return (
		<>
			<Hero title={t("title")} subtitle={t("subtitle")} />
			<section className="mx-auto max-w-5xl px-6 pb-24">
				<div className="grid gap-6 md:grid-cols-3">
					{plans.map((plan) => (
						<PricingCard
							key={plan.key}
							name={t(`${plan.key}-name`)}
							price={t(`${plan.key}-price`)}
							description={t(`${plan.key}-desc`)}
							features={[...Array(maxFeatures[plan.key] ?? 4)].map((_, i) => t(`${plan.key}-feature-${i + 1}`)).filter(Boolean)}
							highlighted={plan.highlighted}
							ctaLabel={plan.key === "enterprise" ? t("custom-cta") : undefined}
						/>
					))}
				</div>
				<div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center relative isolate overflow-hidden">
					<div className="pointer-events-none absolute -inset-32 -z-10 opacity-30" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)" }} aria-hidden="true" />
					<h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{t("custom-title")}</h3>
					<p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{t("custom-desc")}</p>
					<a href="mailto:sales@zuiio.com" className="btn-primary mt-6 inline-flex">
						{t("custom-cta")}
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
					</a>
				</div>
			</section>
		</>
	);
}
